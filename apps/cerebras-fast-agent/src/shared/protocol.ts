import { CHARS_PER_TOKEN } from "./constants";

export type RuntimeMode = "live" | "mock";
export type BookingStrategy = "sequential" | "parallel";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type BookingResult = {
  confirmationId: string;
  restaurantId: string;
  restaurantName: string;
  neighborhood: string;
  cuisine: string;
  price: string;
  rating: number;
  dateLabel: string;
  time: string;
  partySize: number;
};

export type ChatEvent =
  | { type: "meta"; mode: RuntimeMode; model: string }
  | { type: "token"; text: string }
  | {
      type: "metrics";
      ttftMs: number | null;
      tokens: number;
      tokPerSec: number;
      elapsedMs: number;
    }
  | {
      type: "done";
      usage?: { promptTokens?: number; completionTokens?: number };
    }
  | { type: "error"; message: string };

export type BookingEvent =
  | { type: "meta"; mode: RuntimeMode; parallel: boolean; model: string }
  | {
      type: "span_start";
      id: string;
      kind: "llm" | "tool";
      name: string;
      label: string;
      startMs: number;
    }
  | { type: "span_end"; id: string; endMs: number; detail?: string }
  | { type: "token"; text: string }
  | {
      type: "done";
      totalMs: number;
      toolCount: number;
      booked?: BookingResult;
    }
  | { type: "error"; message: string };

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.round(text.length / CHARS_PER_TOKEN));
}
