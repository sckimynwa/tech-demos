import {
  DEFAULT_API_PORT,
  DEFAULT_CEREBRAS_BASE_URL,
  DEFAULT_CEREBRAS_MODEL,
} from "../src/shared/constants";

export function getRuntimeMode(): "live" | "mock" {
  return process.env.CEREBRAS_API_KEY?.trim() ? "live" : "mock";
}

export function getApiKey(): string | undefined {
  const key = process.env.CEREBRAS_API_KEY?.trim();
  return key ? key : undefined;
}

export function getModel(): string {
  return process.env.CEREBRAS_MODEL?.trim() || DEFAULT_CEREBRAS_MODEL;
}

export function getBaseUrl(): string {
  return (
    process.env.CEREBRAS_BASE_URL?.trim() || DEFAULT_CEREBRAS_BASE_URL
  ).replace(/\/$/, "");
}

export function getPort(): number {
  const raw = Number(process.env.PORT ?? DEFAULT_API_PORT);
  return Number.isFinite(raw) ? raw : DEFAULT_API_PORT;
}
