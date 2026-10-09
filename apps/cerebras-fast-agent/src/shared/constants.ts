export const DEFAULT_CEREBRAS_MODEL = "gpt-oss-120b";
export const DEFAULT_CEREBRAS_BASE_URL = "https://api.cerebras.ai/v1";
export const DEFAULT_API_PORT = 8787;
export const CHARS_PER_TOKEN = 4;
export const MOCK_TOKEN_INTERVAL_MS = 10;
export const SEARCH_LATENCY_MS = 360;
export const BOOK_LATENCY_MS = 620;
export const MAX_TOOL_ROUNDS = 8;
export const SOURCE_POST_URL = "https://x.com/cerebras/status/2103506859709858175";

export const BOOKING_SCENARIO =
  "Book dinner for 4 this Saturday in SoMa — Italian. Check a few places, then reserve the best available table.";

export const CHAT_STARTERS = [
  "Why does wafer-scale inference feel 20x faster in an agent loop?",
  "Explain Cerebras vs GPU decode in four tight sentences.",
  "Give me a 6-bullet briefing on parallel tool calls.",
] as const;
