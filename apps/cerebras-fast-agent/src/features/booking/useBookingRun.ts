import { useState } from "react";
import type { BookingEvent, BookingResult, BookingStrategy } from "@/shared/protocol";
import { consumeSse } from "@/shared/sse";

export type TimelineSpan = {
  id: string;
  kind: "llm" | "tool";
  name: string;
  label: string;
  startMs: number;
  endMs: number | null;
  detail?: string;
};

export type BookingRunState = {
  strategy: BookingStrategy;
  status: "idle" | "running" | "done" | "error";
  spans: TimelineSpan[];
  transcript: string;
  totalMs: number | null;
  toolCount: number;
  booked?: BookingResult;
  error?: string;
  nowMs: number;
};

function emptyRun(strategy: BookingStrategy): BookingRunState {
  return {
    strategy,
    status: "idle",
    spans: [],
    transcript: "",
    totalMs: null,
    toolCount: 0,
    nowMs: 0,
  };
}

export function useBookingRun(strategy: BookingStrategy) {
  const [run, setRun] = useState<BookingRunState>(() => emptyRun(strategy));

  const start = async (prompt: string) => {
    setRun({ ...emptyRun(strategy), status: "running" });
    const clock = Date.now();

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy, prompt }),
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      await consumeSse<BookingEvent>(response, (event) => {
        const nowMs = Date.now() - clock;
        setRun((current) => {
          if (event.type === "span_start") {
            return {
              ...current,
              nowMs,
              spans: [
                ...current.spans,
                {
                  id: event.id,
                  kind: event.kind,
                  name: event.name,
                  label: event.label,
                  startMs: event.startMs,
                  endMs: null,
                },
              ],
            };
          }
          if (event.type === "span_end") {
            return {
              ...current,
              nowMs,
              spans: current.spans.map((span) =>
                span.id === event.id
                  ? { ...span, endMs: event.endMs, detail: event.detail }
                  : span,
              ),
            };
          }
          if (event.type === "token") {
            return { ...current, nowMs, transcript: current.transcript + event.text };
          }
          if (event.type === "error") {
            return { ...current, status: "error", error: event.message, nowMs };
          }
          if (event.type === "done") {
            return {
              ...current,
              status: "done",
              totalMs: event.totalMs,
              toolCount: event.toolCount,
              booked: event.booked,
              nowMs: event.totalMs,
            };
          }
          return { ...current, nowMs };
        });
      });
    } catch (error) {
      setRun((current) => ({
        ...current,
        status: "error",
        error: error instanceof Error ? error.message : "Booking run failed",
      }));
    }
  };

  const reset = () => setRun(emptyRun(strategy));

  return { run, start, reset };
}
