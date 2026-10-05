import type { SystemOneRequest } from "../src/shared/systemone.ts";

export function liveBaseUrl(): string | null {
  const raw = process.env.KEV_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function defaultModel(): string {
  const raw = process.env.KEV_MODEL?.trim();
  return raw && raw.length > 0 ? raw : "kev-latest";
}

export function baseUrlHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export async function forwardSystemOne(
  request: SystemOneRequest,
): Promise<{ status: number; body: string; requestId: string | null }> {
  const base = liveBaseUrl();
  if (!base) {
    throw new Error("KEV_BASE_URL is unset");
  }
  const headers = new Headers({ "content-type": "application/json" });
  const apiKey = process.env.KEV_API_KEY?.trim();
  if (apiKey) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  }
  const response = await fetch(`${base}/v1/systemone`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  const body = await response.text();
  return {
    status: response.status,
    body,
    requestId: response.headers.get("x-typesafe-request-id"),
  };
}
