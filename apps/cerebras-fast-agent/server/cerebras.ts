import { estimateTokens } from "../src/shared/protocol";
import { getApiKey, getBaseUrl, getModel } from "./constants";

type ChatCompletionMessage = {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }>;
};

type ChatCompletionChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
    message?: ChatCompletionMessage;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

export async function cerebrasRequest(body: Record<string, unknown>): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("CEREBRAS_API_KEY is not set");
  }

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      ...body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cerebras ${response.status}: ${text.slice(0, 400)}`);
  }

  return response;
}

export async function* iterateSseJson(
  response: Response,
): AsyncGenerator<ChatCompletionChunk> {
  if (!response.body) {
    throw new Error("Cerebras response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      yield JSON.parse(payload) as ChatCompletionChunk;
    }
  }
}

export function metricsFromText(
  text: string,
  startedAt: number,
  firstTokenAt: number | null,
  completionTokens?: number,
) {
  const elapsedMs = Math.max(1, Date.now() - startedAt);
  const tokens = completionTokens ?? estimateTokens(text);
  const generationMs = firstTokenAt ? Math.max(1, Date.now() - firstTokenAt) : elapsedMs;
  return {
    ttftMs: firstTokenAt ? firstTokenAt - startedAt : null,
    tokens,
    tokPerSec: Number((tokens / (generationMs / 1000)).toFixed(1)),
    elapsedMs,
  };
}

export type ToolRoundResult = {
  content: string;
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  usage?: { promptTokens?: number; completionTokens?: number };
};

export async function completeWithTools(input: {
  messages: unknown[];
  tools: unknown[];
  parallelToolCalls: boolean;
}): Promise<ToolRoundResult> {
  const response = await cerebrasRequest({
    messages: input.messages,
    tools: input.tools,
    tool_choice: "auto",
    parallel_tool_calls: input.parallelToolCalls,
    stream: false,
    temperature: 0.3,
  });
  const json = (await response.json()) as ChatCompletionChunk & {
    choices: Array<{ message: ChatCompletionMessage }>;
  };
  const message = json.choices?.[0]?.message;
  const toolCalls = (message?.tool_calls ?? []).map((call) => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
    } catch {
      parsed = {};
    }
    return {
      id: call.id,
      name: call.function.name,
      arguments: parsed,
    };
  });

  return {
    content: message?.content ?? "",
    toolCalls,
    usage: json.usage
      ? {
          promptTokens: json.usage.prompt_tokens,
          completionTokens: json.usage.completion_tokens,
        }
      : undefined,
  };
}
