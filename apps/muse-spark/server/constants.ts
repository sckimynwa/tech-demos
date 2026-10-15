export const DEFAULT_MODEL = "muse-spark";
export const DEFAULT_BASE_URL = "https://api.meta.ai/v1";
export const FALLBACK_MODEL = "muse-spark-1.3";
export const MAX_TOOL_ROUNDS = 2;
export const MOCK_TOKEN_DELAY_MS = 18;
export const API_PORT = Number(process.env.API_PORT ?? 3001);

export function resolveModel() {
  return process.env.MODEL?.trim() || DEFAULT_MODEL;
}

export function resolveBaseUrl() {
  return (process.env.MODEL_API_BASE?.trim() || DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export function resolveApiKey() {
  return process.env.MODEL_API_KEY?.trim() || "";
}

export function resolveMode() {
  return resolveApiKey() ? "live" : "mock";
}
