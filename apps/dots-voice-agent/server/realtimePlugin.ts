import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const CLIENT_SECRET_URL = "https://api.openai.com/v1/realtime/client_secrets";
const DEFAULT_REALTIME_MODEL = "gpt-realtime";
const DEFAULT_REALTIME_VOICE = "marin";

export const REALTIME_TOOLS = [
  {
    type: "function",
    name: "queue_research",
    description:
      "Queue a background web-research job. Returns immediately. Speak a short confirmation, then keep the call open.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to research" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "queue_summary",
    description:
      "Queue a background summary job. Returns immediately. Speak a short confirmation, then keep the call open.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to summarize" },
      },
      required: ["query"],
    },
  },
  {
    type: "function",
    name: "queue_file_write",
    description:
      "Queue a mock file-write job (notes on the agent's workspace). Returns immediately.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Filename hint plus what to write",
        },
      },
      required: ["query"],
    },
  },
] as const;

export const REALTIME_INSTRUCTIONS = `You are a Dots-style always-on voice agent.
The call stays open. The user will keep talking while you work.

When they ask you to research, look something up, summarize, recap, write a note, or save a file:
1. Call the matching tool immediately (queue_research, queue_summary, or queue_file_write).
2. Confirm in one short sentence that you queued it and will speak when it lands.
3. Stay on the line. Do not wait silently. Answer follow-ups.

When you receive a [TASK COMPLETE] user message, speak that result FIRST before anything else.
Lead with "Research done", "Summary ready", or "File written". Keep it spoken-friendly and tight.`;

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("invalid json"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function hasApiKey(env: Record<string, string>) {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

async function handleConfig(
  res: ServerResponse,
  env: Record<string, string>,
) {
  sendJson(res, 200, {
    mode: hasApiKey(env) ? "realtime" : "mock",
    model: env.OPENAI_REALTIME_MODEL?.trim() || DEFAULT_REALTIME_MODEL,
    voice: env.OPENAI_REALTIME_VOICE?.trim() || DEFAULT_REALTIME_VOICE,
  });
}

async function handleClientSecret(
  res: ServerResponse,
  env: Record<string, string>,
) {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 503, {
      error: "OPENAI_API_KEY is unset. Use the simulated path.",
    });
    return;
  }

  const model = env.OPENAI_REALTIME_MODEL?.trim() || DEFAULT_REALTIME_MODEL;
  const voice = env.OPENAI_REALTIME_VOICE?.trim() || DEFAULT_REALTIME_VOICE;

  const response = await fetch(CLIENT_SECRET_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        instructions: REALTIME_INSTRUCTIONS,
        tools: REALTIME_TOOLS,
        audio: {
          output: { voice },
        },
      },
    }),
  });

  const payload = (await response.json()) as {
    value?: string;
    client_secret?: { value?: string };
    error?: { message?: string };
  };

  if (!response.ok) {
    sendJson(res, response.status, {
      error: payload.error?.message || "Failed to mint Realtime client secret",
    });
    return;
  }

  const value = payload.value || payload.client_secret?.value;
  if (!value) {
    sendJson(res, 502, { error: "Realtime client secret missing value" });
    return;
  }

  sendJson(res, 200, { value, model, voice });
}

function attach(
  middlewares: {
    use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
  },
  env: Record<string, string>,
) {
  middlewares.use((req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (req.method === "GET" && url === "/api/config") {
      void handleConfig(res, env);
      return;
    }
    if (req.method === "POST" && url === "/api/realtime/client-secret") {
      void readJsonBody(req)
        .then(() => handleClientSecret(res, env))
        .catch(() => sendJson(res, 400, { error: "invalid json" }));
      return;
    }
    next();
  });
}

export function realtimePlugin(env: Record<string, string>): Plugin {
  return {
    name: "dots-realtime-api",
    configureServer(server) {
      attach(server.middlewares, env);
    },
    configurePreviewServer(server) {
      attach(server.middlewares, env);
    },
  };
}
