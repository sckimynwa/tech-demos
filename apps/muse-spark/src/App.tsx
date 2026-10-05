import { useEffect, useRef, useState } from "react";
import { Composer, SUGGESTED_PROMPTS } from "@/components/Composer";
import { HeaderBar } from "@/components/HeaderBar";
import { Transcript } from "@/components/Transcript";
import { sendChat, readSse } from "@/lib/stream";
import type { ChatTurn, Health } from "@/lib/types";
import { uid } from "@/lib/utils";

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void fetch("/api/health")
      .then((response) => response.json())
      .then((data: Health) => setHealth(data))
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, streaming]);

  const send = async (text: string) => {
    const prompt = text.trim();
    if (!prompt || streaming) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userTurn: ChatTurn = { id: uid("user"), kind: "user", text: prompt };
    const assistantId = uid("asst");
    const nextTurns: ChatTurn[] = [
      ...turns,
      userTurn,
      { id: assistantId, kind: "assistant", text: "", traces: [] },
    ];

    setDraft("");
    setError(null);
    setTurns(nextTurns);
    setStreaming(true);

    const patchAssistant = (
      updater: (turn: Extract<ChatTurn, { kind: "assistant" }>) => Extract<
        ChatTurn,
        { kind: "assistant" }
      >,
    ) => {
      setTurns((current) =>
        current.map((turn) =>
          turn.id === assistantId && turn.kind === "assistant"
            ? updater(turn)
            : turn,
        ),
      );
    };

    try {
      const response = await sendChat(nextTurns, controller.signal);
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || `HTTP ${response.status}`);
      }

      for await (const event of readSse(response)) {
        if (event.event === "delta") {
          patchAssistant((turn) => ({
            ...turn,
            text: turn.text + event.data.text,
          }));
        } else if (event.event === "tool_call") {
          patchAssistant((turn) => ({
            ...turn,
            traces: [
              ...turn.traces.filter((trace) => trace.id !== event.data.id),
              {
                id: event.data.id,
                name: event.data.name,
                arguments: event.data.arguments,
                status: "running",
              },
            ],
          }));
        } else if (event.event === "tool_result") {
          patchAssistant((turn) => ({
            ...turn,
            traces: turn.traces.map((trace) =>
              trace.id === event.data.id
                ? { ...trace, result: event.data.result, status: "done" }
                : trace,
            ),
          }));
        } else if (event.event === "meta" && event.data.model) {
          setHealth((current) =>
            current
              ? { ...current, mode: event.data.mode ?? current.mode, model: event.data.model }
              : current,
          );
        } else if (event.event === "error") {
          setError(event.data.message);
        }
      }
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setStreaming(false);
    }
  };

  const isEmpty = turns.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col">
      <HeaderBar health={health} />
      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-6 md:px-8">
        {isEmpty ? (
          <EmptyState onSuggest={(prompt) => void send(prompt)} />
        ) : (
          <Transcript turns={turns} streaming={streaming} />
        )}
        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={() => void send(draft)}
        onSuggest={(prompt) => void send(prompt)}
        disabled={streaming}
      />
    </div>
  );
}

function EmptyState({ onSuggest }: { onSuggest: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-5 pt-10">
      <p className="font-serif text-3xl leading-tight">
        Point a chat at Muse Spark. Stream tokens. Watch a 1–2 tool loop.
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        No <code className="font-mono text-foreground/80">MODEL_API_KEY</code>?
        Mock mode still streams and fires <code className="font-mono">get_weather</code>{" "}
        / <code className="font-mono">get_current_time</code>. The key never
        leaves the Bun server.
      </p>
      <div className="flex flex-col gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSuggest(prompt)}
            className="text-left text-sm text-primary underline-offset-4 hover:underline"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
