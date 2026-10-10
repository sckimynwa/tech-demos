import type { AgentTask, TaskKind } from "@/domains/queue/types";

export type VoiceMode = "mock" | "realtime" | "local";

export type CallState = "idle" | "connecting" | "live" | "error";

export type MicState = "idle" | "listening" | "speaking";

export type RealtimeGuards = {
  silenceSeconds: number;
  maxSessionSeconds: number;
};

export type LocalSettings = {
  sidecarUrl: string;
  ollamaHost: string;
  llmModel: string;
  refine: boolean;
};

export type LocalStatus = {
  stt: {
    ready: boolean;
    detail: string;
    engine: string;
  };
  ollama: {
    reachable: boolean;
    modelPresent: boolean;
    model: string;
    detail: string;
  };
  refine: boolean;
};

export type SessionConfig = {
  mode: VoiceMode;
  hasRealtimeKey: boolean;
  model: string;
  voice: string;
  realtimeGuards: RealtimeGuards;
  local: LocalSettings;
};

export type VoiceSessionHandlers = {
  onMic: (state: MicState) => void;
  onHeard: (text: string) => void;
  onSpoke: (text: string) => void;
  onTool: (kind: TaskKind, query: string) => string;
  onError: (message: string) => void;
};

export type VoiceSession = {
  connect: () => Promise<void>;
  disconnect: () => void;
  speak: (text: string, opts?: { bargeIn?: boolean }) => Promise<void>;
  submitUtterance: (text: string) => void;
};

export type SpeakRequest = {
  text: string;
  bargeIn?: boolean;
  task?: AgentTask;
};
