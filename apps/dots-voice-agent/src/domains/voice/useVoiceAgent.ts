import { useCallback, useEffect, useRef, useState } from "react";
import { completionLead } from "@/domains/queue/parseIntent";
import { durationForKind, runMockTask } from "@/domains/queue/mockExecutors";
import { SPEAK_LEAD_IN_MS } from "@/lib/constants";
import { createId } from "@/lib/utils";
import type { AgentTask, TaskKind, TimelineEvent } from "@/domains/queue/types";
import { createMockVoiceSession } from "./mockVoice";
import { createRealtimeVoiceSession } from "./realtimeVoice";
import type {
  CallState,
  MicState,
  SessionConfig,
  VoiceSession,
} from "./types";

const FALLBACK_CONFIG: SessionConfig = {
  mode: "mock",
  model: "simulated",
  voice: "browser",
};

export function useVoiceAgent() {
  const [config, setConfig] = useState<SessionConfig>(FALLBACK_CONFIG);
  const [callState, setCallState] = useState<CallState>("idle");
  const [micState, setMicState] = useState<MicState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("Call stays on. Speak work anytime.");
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const sessionRef = useRef<VoiceSession | null>(null);
  const timersRef = useRef<number[]>([]);

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
    let cancelled = false;
    void fetch("/api/config")
      .then((response) => response.json())
      .then((payload: SessionConfig) => {
        if (!cancelled && payload.mode) {
          setConfig(payload);
        }
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

  const hangUp = useCallback(() => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    setCallState("idle");
    setMicState("idle");
    pushEvent({
      kind: "call",
      title: "Call ended. Queued work keeps running.",
    });
  }, [pushEvent]);

  const startCall = useCallback(async () => {
    if (callState === "live" || callState === "connecting") {
      return;
    }
    setError(null);
    setCallState("connecting");
    const handlers = {
      onMic: setMicState,
      onHeard: (text: string) => {
        setCaption(text);
        pushEvent({ kind: "heard", title: "You", detail: text });
      },
      onSpoke: (text: string) => {
        setCaption(text);
        pushEvent({ kind: "spoke", title: "Dot", detail: text });
      },
      onTool: enqueueTask,
      onError: (message: string) => {
        setError(message);
        setCallState("error");
      },
    };
    const session =
      config.mode === "realtime"
        ? createRealtimeVoiceSession(handlers)
        : createMockVoiceSession(handlers);
    sessionRef.current = session;
    try {
      await session.connect();
      setCallState("live");
      pushEvent({
        kind: "call",
        title:
          config.mode === "realtime"
            ? "Realtime call live — leave it on."
            : "Simulated call live — leave it on.",
      });
      void session.speak(
        "I'm on the line. Talk whenever. I'll keep working in the background and speak results first.",
        { bargeIn: true },
      );
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to start the call";
      setError(message);
      setCallState("error");
      session.disconnect();
      sessionRef.current = null;
    }
  }, [callState, config.mode, enqueueTask, pushEvent]);

  const submitUtterance = useCallback((text: string) => {
    sessionRef.current?.submitUtterance(text);
  }, []);

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
