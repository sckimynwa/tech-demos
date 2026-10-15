import type { ApiConfig, SystemOneRequest, SystemOneResponse } from "@/shared/systemone";

export type RunSuccess = {
  ok: true;
  response: SystemOneResponse;
  requestId: string | null;
  mode: "mock" | "live";
  clientMs: number;
};

export type RunFailure = {
  ok: false;
  kind: "unreachable" | "unauthorized" | "validation" | "http";
  status?: number;
  message: string;
  clientMs: number;
};

export type RunResult = RunSuccess | RunFailure;

const COLD_START_HINT_MS = 5000;

export function forceMockFromPage(): boolean {
  return new URLSearchParams(window.location.search).get("mock") === "1";
}

export async function fetchConfig(): Promise<ApiConfig> {
  const mock = forceMockFromPage() ? "?mock=1" : "";
  const response = await fetch(`/api/config${mock}`);
  if (!response.ok) {
    throw new Error(`config ${response.status}`);
  }
  return (await response.json()) as ApiConfig;
}

function detailMessage(body: string, fallback: string): string {
  try {
    const parsed = JSON.parse(body) as { detail?: unknown; message?: unknown };
    if (typeof parsed.detail === "string") return parsed.detail;
    if (Array.isArray(parsed.detail)) return JSON.stringify(parsed.detail);
    if (typeof parsed.message === "string") return parsed.message;
  } catch {
    // raw body
  }
  return body.trim() || fallback;
}

export async function runSystemOne(request: SystemOneRequest): Promise<RunResult> {
  const started = performance.now();
  const mock = forceMockFromPage() ? "?mock=1" : "";
  try {
    const response = await fetch(`/api/systemone${mock}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    const clientMs = Math.round(performance.now() - started);
    const text = await response.text();
    if (response.status === 401) {
      return {
        ok: false,
        kind: "unauthorized",
        status: 401,
        message: detailMessage(text, "401 — bad KEV_API_KEY"),
        clientMs,
      };
    }
    if (response.status === 422) {
      return {
        ok: false,
        kind: "validation",
        status: 422,
        message: detailMessage(text, "422 — validation failed"),
        clientMs,
      };
    }
    if (response.status === 502) {
      return {
        ok: false,
        kind: "unreachable",
        status: 502,
        message: detailMessage(text, "Kev server is unreachable"),
        clientMs,
      };
    }
    if (!response.ok) {
      return {
        ok: false,
        kind: "http",
        status: response.status,
        message: detailMessage(text, `HTTP ${response.status}`),
        clientMs,
      };
    }
    const payload = JSON.parse(text) as SystemOneResponse;
    const headerMode = response.headers.get("x-kev-mode");
    return {
      ok: true,
      response: payload,
      requestId: response.headers.get("x-typesafe-request-id"),
      mode: headerMode === "live" ? "live" : "mock",
      clientMs,
    };
  } catch (error) {
    const clientMs = Math.round(performance.now() - started);
    const message = error instanceof Error ? error.message : "Network error";
    return { ok: false, kind: "unreachable", message, clientMs };
  }
}

export { COLD_START_HINT_MS };
