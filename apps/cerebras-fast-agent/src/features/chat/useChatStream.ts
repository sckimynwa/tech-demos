import { useRef, useState } from "react";
import type { ChatEvent, ChatMessage } from "@/shared/protocol";
import { consumeSse } from "@/shared/sse";

export type Meter = {
  ttftMs: number | null;
  tokens: number;
  tokPerSec: number;
  elapsedMs: number;
};

export type ChatTurn = ChatMessage & { id: string };

const EMPTY_METER: Meter = {
  ttftMs: null,
  tokens: 0,
  tokPerSec: 0,
  elapsedMs: 0,
};

export function useChatStream() {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [meter, setMeter] = useState<Meter>(EMPTY_METER);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || busy) return;

    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const user: ChatTurn = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantId = crypto.randomUUID();
    const history = [...messages, user];

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setMeter(EMPTY_METER);
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content: text }) => ({ role, content: text })),
        }),
        signal: abort.signal,
      });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      await consumeSse<ChatEvent>(response, (event) => {
        if (event.type === "meta") setModel(event.model);
        if (event.type === "token") {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + event.text }
                : message,
            ),
          );
        }
        if (event.type === "metrics") {
          setMeter({
            ttftMs: event.ttftMs,
            tokens: event.tokens,
            tokPerSec: event.tokPerSec,
            elapsedMs: event.elapsedMs,
          });
        }
        if (event.type === "error") setError(event.message);
      });
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  };

  return { messages, meter, busy, error, model, send };
}
