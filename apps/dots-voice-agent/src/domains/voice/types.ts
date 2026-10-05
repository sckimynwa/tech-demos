import type { AgentTask, TaskKind } from "@/domains/queue/types";

export type VoiceMode = "mock" | "realtime";

export type CallState = "idle" | "connecting" | "live" | "error";

export type MicState = "idle" | "listening" | "speaking";

export type SessionConfig = {
  mode: VoiceMode;
  model: string;
  voice: string;
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
