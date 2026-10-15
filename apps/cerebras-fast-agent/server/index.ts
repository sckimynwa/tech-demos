import type { BookingStrategy, ChatMessage } from "../src/shared/protocol";
import { getModel, getPort, getRuntimeMode } from "./constants";
import { streamLiveBooking } from "./live-booking";
import { streamLiveChat } from "./live-chat";
import { streamMockBooking } from "./mock-booking";
import { streamMockChat } from "./mock-chat";
import { jsonResponse, sseStream } from "./sse";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isBookingStrategy(value: unknown): value is BookingStrategy {
  return value === "sequential" || value === "parallel";
}

function asChatMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message) => {
      return (
        message &&
        typeof message === "object" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string"
      );
    })
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.content as string,
    }));
}

const port = getPort();

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return withCors(
        jsonResponse({
          ok: true,
          mode: getRuntimeMode(),
          model: getRuntimeMode() === "live" ? getModel() : "mock-cerebras-sim",
        }),
      );
    }

    if (request.method === "POST" && url.pathname === "/api/chat") {
      const body = (await request.json().catch(() => ({}))) as { messages?: unknown };
      const messages = asChatMessages(body.messages);
      if (messages.length === 0) {
        return withCors(jsonResponse({ error: "messages required" }, 400));
      }
      const mode = getRuntimeMode();
      return withCors(
        sseStream((controller) =>
          mode === "live"
            ? streamLiveChat(controller, messages)
            : streamMockChat(controller, messages),
        ),
      );
    }

    if (request.method === "POST" && url.pathname === "/api/booking") {
      const body = (await request.json().catch(() => ({}))) as {
        strategy?: unknown;
        prompt?: unknown;
      };
      if (!isBookingStrategy(body.strategy)) {
        return withCors(jsonResponse({ error: "strategy must be sequential or parallel" }, 400));
      }
      const prompt = typeof body.prompt === "string" ? body.prompt : "";
      const mode = getRuntimeMode();
      return withCors(
        sseStream((controller) =>
          mode === "live"
            ? streamLiveBooking(controller, body.strategy, prompt)
            : streamMockBooking(controller, body.strategy),
        ),
      );
    }

    return withCors(jsonResponse({ error: "not found" }, 404));
  },
});

console.log(
  `[cerebras-fast-agent] API ${getRuntimeMode()} on http://127.0.0.1:${port} (${getRuntimeMode() === "live" ? getModel() : "mock"})`,
);
