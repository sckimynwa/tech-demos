import { FALLBACK_MODEL } from "./constants";
import { executeTool, TOOL_DEFINITIONS } from "./tools";
import { streamText } from "./sse";
import type { ChatMessage, SseSender, ToolCall } from "./types";

type StreamResult = {
  content: string;
  toolCalls: ToolCall[];
  finishReason: string;
};

function parseArgs(raw: string) {
  if (!raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return { value: parsed };
  } catch {
    return { raw };
  }
}

async function readSseChunks(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => Promise<void>,
): Promise<StreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let finishReason = "stop";
  const byIndex = new Map<
    number,
    { id: string; name: string; arguments: string }
  >();

  const consumeBlock = async (block: string) => {
    const dataLines = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length === 0) return;
    const payload = dataLines.join("\n");
    if (payload === "[DONE]") return;

    const json: {
      choices?: Array<{
        finish_reason?: string | null;
        delta?: {
          content?: string | null;
          tool_calls?: Array<{
            index?: number;
            id?: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
    } = JSON.parse(payload);

    const choice = json.choices?.[0];
    if (!choice) return;
    if (choice.finish_reason) finishReason = choice.finish_reason;

    const deltaText = choice.delta?.content;
    if (deltaText) {
      content += deltaText;
      await onDelta(deltaText);
    }

    for (const toolDelta of choice.delta?.tool_calls ?? []) {
      const index = toolDelta.index ?? 0;
      const current = byIndex.get(index) ?? {
        id: "",
        name: "",
        arguments: "",
      };
      if (toolDelta.id) current.id = toolDelta.id;
      if (toolDelta.function?.name) current.name += toolDelta.function.name;
      if (toolDelta.function?.arguments) {
        current.arguments += toolDelta.function.arguments;
      }
      byIndex.set(index, current);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      if (block.trim()) await consumeBlock(block);
    }
    if (done) break;
  }

  if (buffer.trim()) await consumeBlock(buffer);

  const toolCalls: ToolCall[] = [...byIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, call], index) => ({
      id: call.id || `call_${index}`,
      name: call.name,
      arguments: parseArgs(call.arguments),
    }))
    .filter((call) => call.name);

  return { content, toolCalls, finishReason };
}

async function completeOnce(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  onDelta: (text: string) => Promise<void>;
}): Promise<StreamResult> {
  const response = await fetch(`${input.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      stream: true,
      messages: input.messages,
      tools: TOOL_DEFINITIONS,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Model API ${response.status}: ${detail.slice(0, 400)}`);
  }

  if (!response.body) {
    throw new Error("Model API returned an empty body");
  }

  return readSseChunks(response.body, input.onDelta);
}

export async function runLiveAgent(
  sender: SseSender,
  input: {
    messages: ChatMessage[];
    apiKey: string;
    baseUrl: string;
    model: string;
    maxRounds: number;
  },
) {
  let model = input.model;
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are Muse Spark in a tiny playground. Prefer the provided tools for time and weather. Keep answers short.",
    },
    ...input.messages,
  ];

  let rounds = 0;

  for (let round = 0; round <= input.maxRounds; round += 1) {
    let result: StreamResult;
    try {
      result = await completeOnce({
        baseUrl: input.baseUrl,
        apiKey: input.apiKey,
        model,
        messages,
        onDelta: async (text) => {
          await sender.send("delta", { text });
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const canFallback =
        model !== FALLBACK_MODEL &&
        /404|model_not_found/i.test(message);
      if (!canFallback) throw error;
      model = FALLBACK_MODEL;
      await sender.send("meta", { model, fallback: true });
      result = await completeOnce({
        baseUrl: input.baseUrl,
        apiKey: input.apiKey,
        model,
        messages,
        onDelta: async (text) => {
          await sender.send("delta", { text });
        },
      });
    }

    if (result.toolCalls.length === 0 || round === input.maxRounds) {
      if (!result.content && result.toolCalls.length > 0) {
        await streamText(
          sender,
          "Hit the tool-round cap. Set a more specific follow-up if you want another loop.",
          12,
        );
      }
      await sender.send("done", {
        finishReason: result.finishReason,
        rounds,
        model,
      });
      return;
    }

    rounds += 1;
    messages.push({
      role: "assistant",
      content: result.content || null,
      tool_calls: result.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      })),
    });

    for (const call of result.toolCalls) {
      await sender.send("tool_call", {
        id: call.id,
        name: call.name,
        arguments: call.arguments,
      });
      const toolResult = executeTool(call.name, call.arguments);
      await sender.send("tool_result", {
        id: call.id,
        name: call.name,
        result: toolResult,
      });
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(toolResult),
      });
    }
  }
}
