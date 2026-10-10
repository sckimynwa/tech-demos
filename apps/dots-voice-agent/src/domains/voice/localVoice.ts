import { confirmationLine } from "@/domains/queue/parseIntent";
import type { TaskKind } from "@/domains/queue/types";
import { startEnergyVad, type VadController } from "./vad";
import { speakWithBrowser } from "./speakBrowser";
import type { VoiceSession, VoiceSessionHandlers } from "./types";

type ChatResponse = {
  transcript?: string;
  refined?: string;
  tool?: TaskKind | null;
  query?: string;
  say?: string;
  error?: string;
};

async function transcribePcm(pcm16: string, sampleRate: number) {
  const response = await fetch("/api/local/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pcm16, sampleRate }),
  });
  const payload = (await response.json()) as { text?: string; error?: string };
  if (!response.ok) {
    throw new Error(payload.error || `STT HTTP ${response.status}`);
  }
  const text = payload.text?.trim();
  if (!text) {
    throw new Error("Moonshine returned an empty transcript");
  }
  return text;
}

async function askQwen(transcript: string) {
  const response = await fetch("/api/local/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });
  const payload = (await response.json()) as ChatResponse;
  if (!response.ok) {
    throw new Error(payload.error || `Qwen HTTP ${response.status}`);
  }
  return payload;
}

export function createLocalVoiceSession(
  handlers: VoiceSessionHandlers,
): VoiceSession {
  let live = false;
  let mic: MediaStream | null = null;
  let vad: VadController | null = null;
  let speakQueue: Promise<void> = Promise.resolve();
  let busy = false;

  const handleTranscript = async (raw: string, fromStt: boolean) => {
    const heard = raw.trim();
    if (!heard || !live) {
      return;
    }
    handlers.onHeard(fromStt ? `[STT] ${heard}` : heard);
    try {
      const reply = await askQwen(heard);
      const display = reply.refined?.trim() || heard;
      if (reply.refined && reply.refined.trim() !== heard) {
        handlers.onHeard(`[refine] ${reply.refined.trim()}`);
      }
      if (reply.tool) {
        handlers.onTool(reply.tool, reply.query || display);
      }
      const spoken =
        reply.say?.trim() ||
        (reply.tool ? confirmationLine(reply.tool, reply.query || display) : "");
      if (spoken) {
        void session.speak(spoken, { bargeIn: false });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      handlers.onError(message);
      void session.speak(
        `Qwen is not available. ${message}`,
        { bargeIn: false },
      );
    }
  };

  const session: VoiceSession = {
    async connect() {
      live = true;
      handlers.onMic("listening");
      try {
        mic = await navigator.mediaDevices.getUserMedia({ audio: true });
        vad = startEnergyVad(
          mic,
          (pcm16, sampleRate) => {
            if (!live || busy) {
              return;
            }
            busy = true;
            void transcribePcm(pcm16, sampleRate)
              .then((text) => handleTranscript(text, true))
              .catch((error) => {
                const message =
                  error instanceof Error ? error.message : String(error);
                handlers.onError(message);
              })
              .finally(() => {
                busy = false;
              });
          },
          () => {
            if (live) {
              handlers.onMic("listening");
            }
          },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        handlers.onError(
          `Microphone unavailable (${message}). Type instead — Moonshine will not invent a transcript.`,
        );
      }
    },
    disconnect() {
      live = false;
      vad?.stop();
      vad = null;
      mic?.getTracks().forEach((track) => track.stop());
      mic = null;
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
        .then(() => speakWithBrowser(text, bargeIn, "ko-KR"))
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
      void handleTranscript(text, false);
    },
  };

  return session;
}
