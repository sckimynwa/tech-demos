import { API_PORT, resolveBaseUrl, resolveMode, resolveModel } from "./constants";
import { runAgent } from "./agent";
import { createSseResponse } from "./sse";
import { TOOL_NAMES } from "./tools";
import type { ChatMessage } from "./types";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const role = (value as ChatMessage).role;
  return (
    role === "user" ||
    role === "assistant" ||
    role === "system" ||
    role === "tool"
  );
}

const server = Bun.serve({
  hostname: "0.0.0.0",
  port: API_PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "content-type",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        ok: true,
        mode: resolveMode(),
        model: resolveModel(),
        baseUrl: resolveBaseUrl(),
        tools: TOOL_NAMES,
      });
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      const messages = (body as { messages?: unknown }).messages;
      if (!Array.isArray(messages) || messages.length === 0) {
        return json({ error: "messages[] is required" }, 400);
      }
      if (!messages.every(isChatMessage)) {
        return json({ error: "messages[] contains an invalid item" }, 400);
      }

      return createSseResponse((sender) => runAgent(sender, messages));
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(
  `[muse-spark] ${resolveMode()} agent on http://127.0.0.1:${server.port} (model ${resolveModel()})`,
);
