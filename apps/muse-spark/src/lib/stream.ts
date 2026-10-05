import type { ChatTurn, StreamEvent } from "./types";

export async function* readSse(response: Response): AsyncGenerator<StreamEvent> {
  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const parsed = parseBlock(block);
      if (parsed) yield parsed;
    }

    if (done) break;
  }

  const trailing = parseBlock(buffer);
  if (trailing) yield trailing;
}

function parseBlock(block: string): StreamEvent | null {
  const lines = block.split("\n").filter(Boolean);
  if (lines.length === 0) return null;

  let event = "message";
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;

  return {
    event,
    data: JSON.parse(dataLines.join("\n")),
  } as StreamEvent;
}

export async function sendChat(
  turns: ChatTurn[],
  signal: AbortSignal,
): Promise<Response> {
  const messages = turns
    .filter((turn) => turn.kind === "user" || turn.text.trim().length > 0)
    .map((turn) => ({
      role: turn.kind === "user" ? "user" : "assistant",
      content: turn.text,
    }));

  return fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
}
