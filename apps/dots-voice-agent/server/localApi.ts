import type { IncomingMessage, ServerResponse } from "node:http";
import { readJsonBody, sendJson } from "./httpUtil.ts";

export const DEFAULT_LOCAL_LLM = "qwen3:8b";
export const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";
export const DEFAULT_SIDECAR_URL = "http://127.0.0.1:8765";
export const DEFAULT_SILENCE_S = 60;
export const DEFAULT_MAX_SESSION_S = 600;

export type EnvMap = Record<string, string>;

export function localSettings(env: EnvMap) {
  return {
    sidecarUrl: env.MOONSHINE_SIDECAR_URL?.trim() || DEFAULT_SIDECAR_URL,
    ollamaHost: (env.OLLAMA_HOST?.trim() || DEFAULT_OLLAMA_HOST).replace(
      /\/$/,
      "",
    ),
    llmModel: env.LOCAL_LLM_MODEL?.trim() || DEFAULT_LOCAL_LLM,
    refine: env.LOCAL_REFINE !== "0",
  };
}

export function realtimeGuards(env: EnvMap) {
  return {
    silenceSeconds: Number(env.REALTIME_SILENCE_TIMEOUT_S) || DEFAULT_SILENCE_S,
    maxSessionSeconds:
      Number(env.REALTIME_MAX_SESSION_S) || DEFAULT_MAX_SESSION_S,
  };
}

type SttStatus = {
  ready: boolean;
  detail: string;
  engine: string;
};

type OllamaStatus = {
  reachable: boolean;
  modelPresent: boolean;
  model: string;
  tags: string[];
  detail: string;
};

async function probeSidecar(url: string): Promise<SttStatus> {
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(2500),
    });
    const payload = (await response.json()) as {
      ready?: boolean;
      error?: string | null;
      engine?: string;
    };
    if (!response.ok) {
      return {
        ready: false,
        engine: "moonshine-voice",
        detail: `sidecar HTTP ${response.status}`,
      };
    }
    return {
      ready: Boolean(payload.ready),
      engine: payload.engine || "moonshine-voice",
      detail: payload.ready
        ? "Moonshine Tiny Korean loaded (non-streaming)"
        : payload.error || "sidecar is up but the model is not loaded",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ready: false,
      engine: "moonshine-voice",
      detail: `sidecar unreachable (${message}). Run bun run sidecar`,
    };
  }
}

async function probeOllama(
  host: string,
  model: string,
): Promise<OllamaStatus> {
  try {
    const response = await fetch(`${host}/api/tags`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) {
      return {
        reachable: false,
        modelPresent: false,
        model,
        tags: [],
        detail: `Ollama HTTP ${response.status} at ${host}`,
      };
    }
    const payload = (await response.json()) as {
      models?: { name?: string }[];
    };
    const tags = (payload.models ?? [])
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name));
    const modelPresent = tags.some(
      (tag) => tag === model || tag.startsWith(`${model}:`) || tag.split(":")[0] === model.split(":")[0],
    );
    return {
      reachable: true,
      modelPresent,
      model,
      tags,
      detail: modelPresent
        ? `${model} is present`
        : tags.length === 0
          ? `Ollama is up but has no models. Pull ${model}`
          : `${model} missing. Installed: ${tags.slice(0, 6).join(", ")}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      reachable: false,
      modelPresent: false,
      model,
      tags: [],
      detail: `Ollama unreachable at ${host} (${message})`,
    };
  }
}

export async function handleLocalStatus(res: ServerResponse, env: EnvMap) {
  const settings = localSettings(env);
  const [stt, ollama] = await Promise.all([
    probeSidecar(settings.sidecarUrl),
    probeOllama(settings.ollamaHost, settings.llmModel),
  ]);
  sendJson(res, 200, {
    stt,
    ollama,
    refine: settings.refine,
    sidecarUrl: settings.sidecarUrl,
    ollamaHost: settings.ollamaHost,
  });
}

export async function handleLocalTranscribe(
  req: IncomingMessage,
  res: ServerResponse,
  env: EnvMap,
) {
  const settings = localSettings(env);
  const body = await readJsonBody(req);
  try {
    const response = await fetch(`${settings.sidecarUrl.replace(/\/$/, "")}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const payload = await response.json();
    sendJson(res, response.status, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 503, {
      error: `Moonshine sidecar failed: ${message}. Transcripts are not faked.`,
    });
  }
}

const REFINE_SYSTEM = `You clean Korean ASR transcripts from Moonshine Tiny.
Fix obvious recognition errors only. Keep the speaker's meaning and language.
Return ONLY the cleaned utterance, no quotes, no commentary.`;

const AGENT_SYSTEM = `You are a Dots-style always-on voice agent.
Reply in the user's language (Korean if they spoke Korean).
If they want web research, a summary, or a file/note written, set tool accordingly.
Otherwise tool is null and say is a short spoken reply.
Return ONLY JSON: {"tool":"research"|"summary"|"file_write"|null,"query":"string","say":"short spoken line"}`;

async function ollamaChat(
  host: string,
  model: string,
  messages: { role: string; content: string }[],
) {
  const response = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature: 0.3 },
    }),
    signal: AbortSignal.timeout(120000),
  });
  const payload = (await response.json()) as {
    message?: { content?: string };
    error?: string;
  };
  if (!response.ok) {
    throw new Error(payload.error || `Ollama chat HTTP ${response.status}`);
  }
  return payload.message?.content?.trim() || "";
}

function parseAgentJson(raw: string) {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return { tool: null, query: "", say: raw };
  }
  const parsed = JSON.parse(match[0]) as {
    tool?: string | null;
    query?: string;
    say?: string;
  };
  const tool =
    parsed.tool === "research" ||
    parsed.tool === "summary" ||
    parsed.tool === "file_write"
      ? parsed.tool
      : null;
  return {
    tool,
    query: parsed.query?.trim() || "",
    say: parsed.say?.trim() || raw,
  };
}

export async function handleLocalChat(
  req: IncomingMessage,
  res: ServerResponse,
  env: EnvMap,
) {
  const settings = localSettings(env);
  const body = (await readJsonBody(req)) as {
    transcript?: string;
    refine?: boolean;
  };
  const transcript = body.transcript?.trim();
  if (!transcript) {
    sendJson(res, 400, { error: "transcript is required" });
    return;
  }

  const ollama = await probeOllama(settings.ollamaHost, settings.llmModel);
  if (!ollama.reachable) {
    sendJson(res, 503, {
      transcript,
      error: ollama.detail,
    });
    return;
  }
  if (!ollama.modelPresent) {
    sendJson(res, 503, {
      transcript,
      error: ollama.detail,
    });
    return;
  }

  let refined = transcript;
  const shouldRefine = body.refine ?? settings.refine;
  if (shouldRefine) {
    try {
      refined = await ollamaChat(settings.ollamaHost, settings.llmModel, [
        { role: "system", content: REFINE_SYSTEM },
        { role: "user", content: transcript },
      ]);
      if (!refined) {
        refined = transcript;
      }
    } catch {
      refined = transcript;
    }
  }

  try {
    const raw = await ollamaChat(settings.ollamaHost, settings.llmModel, [
      { role: "system", content: AGENT_SYSTEM },
      { role: "user", content: refined },
    ]);
    const agent = parseAgentJson(raw);
    sendJson(res, 200, {
      transcript,
      refined: shouldRefine ? refined : undefined,
      ...agent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 503, {
      transcript,
      refined: shouldRefine ? refined : undefined,
      error: message,
    });
  }
}

export function attachLocalApi(
  middlewares: {
    use: (
      fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void,
    ) => void;
  },
  env: EnvMap,
) {
  middlewares.use((req, res, next) => {
    const url = req.url?.split("?")[0] ?? "";
    if (req.method === "GET" && url === "/api/local/status") {
      void handleLocalStatus(res, env);
      return;
    }
    if (req.method === "POST" && url === "/api/local/transcribe") {
      void handleLocalTranscribe(req, res, env).catch((error) => {
        sendJson(res, 500, {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      return;
    }
    if (req.method === "POST" && url === "/api/local/chat") {
      void handleLocalChat(req, res, env).catch((error) => {
        sendJson(res, 500, {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      return;
    }
    next();
  });
}
