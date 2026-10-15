import type { ChatEvent, ChatMessage } from "../src/shared/protocol";
import { cerebrasRequest, iterateSseJson, metricsFromText } from "./cerebras";
import { getModel } from "./constants";
import { writeSse } from "./sse";

const SYSTEM_PROMPT =
  "You are a terse inference-lab assistant. Explain Cerebras-speed agents, tok/s, and parallel tool calling without fluff.";

export async function streamLiveChat(
  controller: ReadableStreamDefaultController<Uint8Array>,
  messages: ChatMessage[],
): Promise<void> {
  const startedAt = Date.now();
  let firstTokenAt: number | null = null;
  let output = "";

  writeSse(controller, {
    type: "meta",
    mode: "live",
    model: getModel(),
  } satisfies ChatEvent);

  const response = await cerebrasRequest({
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    stream: true,
    stream_options: { include_usage: true },
    temperature: 0.4,
    max_tokens: 700,
  });

  let completionTokens: number | undefined;

  for await (const chunk of iterateSseJson(response)) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) {
      if (!firstTokenAt) firstTokenAt = Date.now();
      output += delta;
      writeSse(controller, { type: "token", text: delta } satisfies ChatEvent);
      writeSse(controller, {
        type: "metrics",
        ...metricsFromText(output, startedAt, firstTokenAt),
      } satisfies ChatEvent);
    }
    if (chunk.usage?.completion_tokens) {
      completionTokens = chunk.usage.completion_tokens;
    }
  }

  writeSse(controller, {
    type: "metrics",
    ...metricsFromText(output, startedAt, firstTokenAt, completionTokens),
  } satisfies ChatEvent);
  writeSse(controller, {
    type: "done",
    usage: { completionTokens },
  } satisfies ChatEvent);
}
