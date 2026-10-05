import { MOCK_THINK_MS } from "@/lib/constants";
import {
  confirmationLine,
  parseTaskKind,
} from "@/domains/queue/parseIntent";
import type { VoiceSession, VoiceSessionHandlers } from "./types";

function speakWithBrowser(text: string, bargeIn: boolean) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    if (bargeIn) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.04;
    utterance.pitch = 1.02;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function createMockVoiceSession(
  handlers: VoiceSessionHandlers,
): VoiceSession {
  let live = false;
  let speakQueue: Promise<void> = Promise.resolve();

  const session: VoiceSession = {
    async connect() {
      live = true;
      handlers.onMic("listening");
    },
    disconnect() {
      live = false;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      handlers.onMic("idle");
    },
    speak(text, opts) {
      if (!live) {
        return Promise.resolve();
      }
      const bargeIn = opts?.bargeIn ?? true;
      handlers.onSpoke(text);
      handlers.onMic("speaking");
      speakQueue = speakQueue
        .catch(() => undefined)
        .then(() => speakWithBrowser(text, bargeIn))
        .then(() => {
          if (live) {
            handlers.onMic("listening");
          }
        });
      return speakQueue;
    },
    submitUtterance(text) {
      if (!live) {
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return;
      }
      handlers.onHeard(trimmed);
      const kind = parseTaskKind(trimmed);
      window.setTimeout(() => {
        if (!live) {
          return;
        }
        handlers.onTool(kind, trimmed);
        void session.speak(confirmationLine(kind, trimmed), { bargeIn: false });
      }, MOCK_THINK_MS);
    },
  };

  return session;
}
