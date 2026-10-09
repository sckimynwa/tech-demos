import { MOCK_TOKEN_INTERVAL_MS } from "../src/shared/constants";
import type { ChatEvent, ChatMessage } from "../src/shared/protocol";
import { metricsFromText } from "./cerebras";
import { writeSse } from "./sse";

const MOCK_REPLIES: Record<string, string> = {
  default: [
    "Wafer-scale inference collapses the usual GPU tax: weights stay on-chip, so decode is memory-bound instead of PCIe-bound.",
    "In an agent loop that is mostly short generations + tool hops, that shows up as 20x wall-clock, not a prettier token graph.",
    "Parallel tool calls then stop the tools from serializing the win — Cerebras finishes thinking before the reservation APIs return.",
  ].join(" "),
  wafer: [
    "Cerebras keeps the whole model on one wafer. No shard chatter, no HBM round-trips per token.",
    "GPUs spend most of decode waiting on memory. Wafer SRAM is local, so tokens drip out at hundreds to thousands per second.",
    "That is why a personal agent harness feels instant even when it plans, calls tools, and writes the confirmation.",
  ].join(" "),
  parallel: [
    "Sequential tool calling is: think → wait → think → wait. The model is idle most of the time.",
    "Parallel tool calling fires independent lookups in one turn — availability + menus in a single wave.",
    "Cerebras makes the think slice cheap. Parallelism makes the wait slice overlap. Together they look like a 20x Grok bot.",
  ].join(" "),
};

function pickReply(messages: ChatMessage[]): string {
  const last = messages.at(-1)?.content.toLowerCase() ?? "";
  if (last.includes("parallel") || last.includes("tool")) return MOCK_REPLIES.parallel;
  if (last.includes("wafer") || last.includes("gpu") || last.includes("20x")) {
    return MOCK_REPLIES.wafer;
  }
  return MOCK_REPLIES.default;
}

function chunkText(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text];
}

export async function streamMockChat(
  controller: ReadableStreamDefaultController<Uint8Array>,
  messages: ChatMessage[],
): Promise<void> {
  const startedAt = Date.now();
  let firstTokenAt: number | null = null;
  let output = "";

  writeSse(controller, {
    type: "meta",
    mode: "mock",
    model: "mock-cerebras-sim",
  } satisfies ChatEvent);

  for (const chunk of chunkText(pickReply(messages))) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_TOKEN_INTERVAL_MS));
    if (!firstTokenAt) firstTokenAt = Date.now();
    output += chunk;
    writeSse(controller, { type: "token", text: chunk } satisfies ChatEvent);
    writeSse(controller, {
      type: "metrics",
      ...metricsFromText(output, startedAt, firstTokenAt),
    } satisfies ChatEvent);
  }

  writeSse(controller, {
    type: "done",
    usage: { completionTokens: metricsFromText(output, startedAt, firstTokenAt).tokens },
  } satisfies ChatEvent);
}
