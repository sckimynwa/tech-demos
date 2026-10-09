import {
  MAX_TOOL_ROUNDS,
  resolveApiKey,
  resolveBaseUrl,
  resolveMode,
  resolveModel,
} from "./constants";
import { runLiveAgent } from "./live";
import { runMockAgent } from "./mock";
import type { ChatMessage, SseSender } from "./types";

export async function runAgent(sender: SseSender, messages: ChatMessage[]) {
  const mode = resolveMode();
  const model = resolveModel();
  await sender.send("meta", {
    mode,
    model,
    baseUrl: resolveBaseUrl(),
  });

  if (mode === "mock") {
    await runMockAgent(sender, messages);
    return;
  }

  await runLiveAgent(sender, {
    messages,
    apiKey: resolveApiKey(),
    baseUrl: resolveBaseUrl(),
    model,
    maxRounds: MAX_TOOL_ROUNDS,
  });
}
