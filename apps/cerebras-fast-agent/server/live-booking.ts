import { BOOKING_SCENARIO, MAX_TOOL_ROUNDS } from "../src/shared/constants";
import type { BookingEvent, BookingResult, BookingStrategy } from "../src/shared/protocol";
import { completeWithTools, cerebrasRequest, iterateSseJson } from "./cerebras";
import { getModel } from "./constants";
import { writeSse } from "./sse";
import {
  BOOKING_TOOLS,
  executeTool,
  summarizeToolResult,
  toolLabel,
} from "./tools";

const SYSTEM_PROMPT = `You are a San Francisco restaurant-booking agent.
Use tools. Never invent availability.
Search first, inspect a few Italian options near SoMa (availability + menus), then book the best table for 4 this Saturday.
When parallel tool calls are enabled, request independent lookups in one turn.
When they are disabled, call exactly one tool per turn.
Finish by calling book_table, then write a short confirmation.`;

export async function streamLiveBooking(
  controller: ReadableStreamDefaultController<Uint8Array>,
  strategy: BookingStrategy,
  prompt: string,
): Promise<void> {
  const startedAt = Date.now();
  const parallel = strategy === "parallel";
  let toolCount = 0;
  let booked: BookingResult | undefined;

  writeSse(controller, {
    type: "meta",
    mode: "live",
    parallel,
    model: getModel(),
  } satisfies BookingEvent);

  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt || BOOKING_SCENARIO },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const llmId = `llm-${round}-${Date.now()}`;
    writeSse(controller, {
      type: "span_start",
      id: llmId,
      kind: "llm",
      name: "llm",
      label: round === 0 ? "plan" : "next step",
      startMs: Date.now() - startedAt,
    } satisfies BookingEvent);

    const completion = await completeWithTools({
      messages,
      tools: BOOKING_TOOLS,
      parallelToolCalls: parallel,
    });

    writeSse(controller, {
      type: "span_end",
      id: llmId,
      endMs: Date.now() - startedAt,
      detail: completion.toolCalls.length
        ? `${completion.toolCalls.length} tool call${completion.toolCalls.length === 1 ? "" : "s"}`
        : "final",
    } satisfies BookingEvent);

    if (completion.toolCalls.length === 0) {
      if (completion.content) {
        await streamFinalTokens(controller, startedAt, completion.content);
      } else {
        await streamLiveFinal(controller, startedAt, messages);
      }
      break;
    }

    messages.push({
      role: "assistant",
      content: completion.content || null,
      tool_calls: completion.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    });

    const runOne = async (call: (typeof completion.toolCalls)[number]) => {
      const spanId = `${call.id}`;
      writeSse(controller, {
        type: "span_start",
        id: spanId,
        kind: "tool",
        name: call.name,
        label: toolLabel(call.name, call.arguments),
        startMs: Date.now() - startedAt,
      } satisfies BookingEvent);
      const executed = await executeTool(call.name, call.arguments);
      writeSse(controller, {
        type: "span_end",
        id: spanId,
        endMs: Date.now() - startedAt,
        detail: summarizeToolResult(call.name, executed.result),
      } satisfies BookingEvent);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(executed.result),
      });
      toolCount += 1;
      if (executed.booked) booked = executed.booked;
    };

    if (parallel) {
      await Promise.all(completion.toolCalls.map(runOne));
    } else {
      for (const call of completion.toolCalls) {
        await runOne(call);
      }
    }
  }

  writeSse(controller, {
    type: "done",
    totalMs: Date.now() - startedAt,
    toolCount,
    booked,
  } satisfies BookingEvent);
}

async function streamFinalTokens(
  controller: ReadableStreamDefaultController<Uint8Array>,
  startedAt: number,
  content: string,
): Promise<void> {
  const id = `llm-final-${Date.now()}`;
  writeSse(controller, {
    type: "span_start",
    id,
    kind: "llm",
    name: "llm",
    label: "confirm",
    startMs: Date.now() - startedAt,
  } satisfies BookingEvent);
  writeSse(controller, { type: "token", text: content } satisfies BookingEvent);
  writeSse(controller, {
    type: "span_end",
    id,
    endMs: Date.now() - startedAt,
    detail: "confirmation",
  } satisfies BookingEvent);
}

async function streamLiveFinal(
  controller: ReadableStreamDefaultController<Uint8Array>,
  startedAt: number,
  messages: Array<Record<string, unknown>>,
): Promise<void> {
  const id = `llm-final-${Date.now()}`;
  writeSse(controller, {
    type: "span_start",
    id,
    kind: "llm",
    name: "llm",
    label: "confirm",
    startMs: Date.now() - startedAt,
  } satisfies BookingEvent);

  const response = await cerebrasRequest({
    messages,
    stream: true,
    temperature: 0.3,
    max_tokens: 400,
  });

  for await (const chunk of iterateSseJson(response)) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      writeSse(controller, { type: "token", text: delta } satisfies BookingEvent);
    }
  }

  writeSse(controller, {
    type: "span_end",
    id,
    endMs: Date.now() - startedAt,
    detail: "confirmation",
  } satisfies BookingEvent);
}
