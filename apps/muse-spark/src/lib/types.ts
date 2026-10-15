export type RunMode = "mock" | "live";

export type Health = {
  ok: boolean;
  mode: RunMode;
  model: string;
  baseUrl: string;
  tools: string[];
};

export type ToolTrace = {
  id: string;
  name: string;
  arguments: unknown;
  result?: unknown;
  status: "running" | "done";
};

export type ChatTurn =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string; traces: ToolTrace[] };

export type StreamEvent =
  | { event: "meta"; data: { mode: RunMode; model: string; fallback?: boolean } }
  | { event: "delta"; data: { text: string } }
  | {
      event: "tool_call";
      data: { id: string; name: string; arguments: unknown };
    }
  | {
      event: "tool_result";
      data: { id: string; name: string; result: unknown };
    }
  | { event: "done"; data: { finishReason?: string; rounds?: number } }
  | { event: "error"; data: { message: string } };
