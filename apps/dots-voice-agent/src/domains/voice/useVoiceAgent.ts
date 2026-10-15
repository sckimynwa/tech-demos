import { useCallback, useEffect, useRef, useState } from "react";
import { completionLead } from "@/domains/queue/parseIntent";
import { durationForKind, runMockTask } from "@/domains/queue/mockExecutors";
import {
  DEFAULT_MAX_SESSION_S,
  DEFAULT_SILENCE_S,
  MODE_STORAGE_KEY,
  SPEAK_LEAD_IN_MS,
} from "@/lib/constants";
import { createId } from "@/lib/utils";
import type { AgentTask, TaskKind, TimelineEvent } from "@/domains/queue/types";
import { createLocalVoiceSession } from "./localVoice";
import { createMockVoiceSession } from "./mockVoice";
import { createRealtimeVoiceSession } from "./realtimeVoice";
import type {
  CallState,
  LocalStatus,
  MicState,
  SessionConfig,
  VoiceMode,
  VoiceSession,
} from "./types";

const FALLBACK_CONFIG: SessionConfig = {
  mode: "mock",
  hasRealtimeKey: false,
  model: "simulated",
  voice: "browser",
  realtimeGuards: {
    silenceSeconds: DEFAULT_SILENCE_S,
    maxSessionSeconds: DEFAULT_MAX_SESSION_S,
  },
  local: {
    sidecarUrl: "http://127.0.0.1:8765",
    ollamaHost: "http://127.0.0.1:11434",
    llmModel: "qwen3:8b",
    refine: true,
  },
};

function readStoredMode(): VoiceMode | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (value === "mock" || value === "realtime" || value === "local") {
    return value;
  }
  return null;
}

function greetingFor(mode: VoiceMode) {
  if (mode === "local") {
    return "통화 유지할게요. 말씀이 끝나면 Moonshine이 받아적고, Qwen이 답한 뒤 결과를 먼저 말합니다.";
  }
  if (mode === "realtime") {
    return "I'm on the line. Talk whenever. I'll keep working in the background and speak results first.";
  }
  return "I'm on the line. Talk whenever. I'll keep working in the background and speak results first.";
}

export function useVoiceAgent() {
  const [config, setConfig] = useState<SessionConfig>(FALLBACK_CONFIG);
  const [selectedMode, setSelectedMode] = useState<VoiceMode>("mock");
  const [callState, setCallState] = useState<CallState>("idle");
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("Call stays on. Speak work anytime.");
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [localStatus, setLocalStatus] = useState<LocalStatus | null>(null);
  const [guardLabel, setGuardLabel] = useState<string | null>(null);
  const sessionRef = useRef<VoiceSession | null>(null);
  const timersRef = useRef<number[]>([]);
  const startingRef = useRef(false);
  const lastActivityRef = useRef(0);
  const sessionStartedRef = useRef(0);
  const selectedModeRef = useRef<VoiceMode>("mock");

  const pushEvent = useCallback((event: Omit<TimelineEvent, "id" | "at">) => {
    setEvents((current) => [
      {
        id: createId("evt"),
        at: Date.now(),
        ...event,
      },
      ...current,
    ]);
  }, []);

  useEffect(() => {
    selectedModeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/config")
      .then((response) => response.json())
      .then((payload: SessionConfig) => {
        if (cancelled || !payload.mode) {
          return;
        }
        setConfig({
          ...FALLBACK_CONFIG,
          ...payload,
          realtimeGuards: {
            ...FALLBACK_CONFIG.realtimeGuards,
            ...payload.realtimeGuards,
          },
          local: { ...FALLBACK_CONFIG.local, ...payload.local },
        });
        const stored = readStoredMode();
        if (stored === "realtime" && !payload.hasRealtimeKey) {
          setSelectedMode("mock");
          return;
        }
        setSelectedMode(stored ?? payload.mode);
      })
      .catch(() => {
        if (!cancelled) {
          setConfig(FALLBACK_CONFIG);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedMode !== "local") {
      return;
    }
    let cancelled = false;
    const poll = () => {
      void fetch("/api/local/status")
        .then((response) => response.json())
        .then((payload: LocalStatus) => {
          if (!cancelled) {
            setLocalStatus(payload);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setLocalStatus({
              stt: {
                ready: false,
                engine: "moonshine-voice",
                detail: "status probe failed",
              },
              ollama: {
                reachable: false,
                modelPresent: false,
                model: config.local.llmModel,
                detail: "status probe failed",
              },
              refine: config.local.refine,
            });
          }
        });
    };
    poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [selectedMode, config.local.llmModel, config.local.refine]);

  const enqueueTask = useCallback(
    (kind: TaskKind, query: string) => {
      const task: AgentTask = {
        id: createId("task"),
        kind,
        query,
        status: "queued",
        createdAt: Date.now(),
      };
      setTasks((current) => [task, ...current]);
      pushEvent({
        kind: "task",
        title: `Queued ${kind.replace("_", " ")}`,
        detail: query,
        taskId: task.id,
      });

      const startTimer = window.setTimeout(() => {
        setTasks((current) =>
          current.map((item) =>
            item.id === task.id
              ? { ...item, status: "running", startedAt: Date.now() }
              : item,
          ),
        );
      }, 240);
      timersRef.current.push(startTimer);

      const doneTimer = window.setTimeout(() => {
        setTasks((current) => {
          const existing = current.find((item) => item.id === task.id);
          if (!existing) {
            return current;
          }
          const finished = runMockTask({
            ...existing,
            status: "running",
            startedAt: existing.startedAt ?? Date.now(),
          });
          pushEvent({
            kind: "task",
            title: `${completionLead(finished.kind)} ${finished.kind.replace("_", " ")}`,
            detail: finished.result,
            taskId: finished.id,
          });
          window.setTimeout(() => {
            const spoken = `${completionLead(finished.kind)} ${finished.result ?? ""}`.trim();
            void sessionRef.current?.speak(spoken, { bargeIn: true });
          }, SPEAK_LEAD_IN_MS);
          return current.map((item) => (item.id === task.id ? finished : item));
        });
      }, durationForKind(kind));
      timersRef.current.push(doneTimer);

      return task.id;
    },
    [pushEvent],
  );

  const hangUp = useCallback(
    (reason?: string) => {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
      startingRef.current = false;
      setCallState("idle");
      setMicState("idle");
      setGuardLabel(null);
      pushEvent({
        kind: "call",
        title: reason || "Call ended. Queued work keeps running.",
      });
    },
    [pushEvent],
  );

  useEffect(() => {
    if (callState !== "live" || selectedMode !== "realtime") {
      return;
    }
    const tick = window.setInterval(() => {
      const now = Date.now();
      const elapsed = (now - sessionStartedRef.current) / 1000;
      const silent = (now - lastActivityRef.current) / 1000;
      const maxS = config.realtimeGuards.maxSessionSeconds;
      const silenceS = config.realtimeGuards.silenceSeconds;
      const remainSession = Math.max(0, Math.ceil(maxS - elapsed));
      const remainSilence = Math.max(0, Math.ceil(silenceS - silent));
      setGuardLabel(
        `cap ${remainSession}s · silence ${remainSilence}s`,
      );
      if (elapsed >= maxS) {
        hangUp(`Auto hang-up: ${maxS}s session cap.`);
        return;
      }
      if (silent >= silenceS) {
        hangUp(`Auto hang-up: ${silenceS}s of silence.`);
      }
    }, 1000);
    return () => window.clearInterval(tick);
  }, [
    callState,
    selectedMode,
    config.realtimeGuards.maxSessionSeconds,
    config.realtimeGuards.silenceSeconds,
    hangUp,
  ]);

  const startCall = useCallback(async () => {
    if (
      startingRef.current ||
      callState === "live" ||
      callState === "connecting"
    ) {
      return;
    }
    startingRef.current = true;
    setError(null);
    setCallState("connecting");
    const mode = selectedModeRef.current;
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };
    const handlers = {
      onMic: (state: MicState) => {
        setMicState(state);
        if (state === "speaking") {
          markActivity();
        }
      },
      onHeard: (text: string) => {
        markActivity();
        setCaption(text);
        pushEvent({ kind: "heard", title: "You", detail: text });
      },
      onSpoke: (text: string) => {
        markActivity();
        setCaption(text);
        pushEvent({ kind: "spoke", title: "Dot", detail: text });
      },
      onTool: enqueueTask,
      onError: (message: string) => {
        setError(message);
        setCallState((current) =>
          current === "connecting" ? "error" : current,
        );
      },
    };
    const session =
      mode === "realtime"
        ? createRealtimeVoiceSession(handlers)
        : mode === "local"
          ? createLocalVoiceSession(handlers)
          : createMockVoiceSession(handlers);
    sessionRef.current = session;
    try {
      await session.connect();
      sessionStartedRef.current = Date.now();
      lastActivityRef.current = Date.now();
      setCallState("live");
      startingRef.current = false;
      const title =
        mode === "realtime"
          ? "Realtime call live — leave it on."
          : mode === "local"
            ? "Local call live — Moonshine VAD + Qwen."
            : "Simulated call live — leave it on.";
      pushEvent({ kind: "call", title });
      void session.speak(greetingFor(mode), { bargeIn: true });
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to start the call";
      setError(message);
      setCallState("error");
      session.disconnect();
      sessionRef.current = null;
      startingRef.current = false;
    }
  }, [callState, enqueueTask, pushEvent]);

  const submitUtterance = useCallback((text: string) => {
    lastActivityRef.current = Date.now();
    sessionRef.current?.submitUtterance(text);
  }, []);

  const changeMode = useCallback(
    (mode: VoiceMode) => {
      if (mode === "realtime" && !config.hasRealtimeKey) {
        return;
      }
      if (callState === "live" || callState === "connecting") {
        hangUp("Switched mode. Call ended.");
      }
      setSelectedMode(mode);
      window.localStorage.setItem(MODE_STORAGE_KEY, mode);
      setError(null);
    },
    [callState, config.hasRealtimeKey, hangUp],
  );

  useEffect(() => {
    return () => {
      sessionRef.current?.disconnect();
      for (const timer of timersRef.current) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const isOnCall = callState === "live";
  const runningCount = tasks.filter(
    (task) => task.status === "queued" || task.status === "running",
  ).length;

  return {
    config,
    selectedMode,
    changeMode,
    localStatus,
    guardLabel,
    callState,
    micState,
    error,
    caption,
    tasks,
    events,
    isOnCall,
    runningCount,
    startCall,
    hangUp,
    submitUtterance,
  };
}
