import type { TASK_KINDS } from "@/lib/constants";

export type TaskKind = (typeof TASK_KINDS)[number];

export type TaskStatus = "queued" | "running" | "done" | "error";

export type AgentTask = {
  id: string;
  kind: TaskKind;
  query: string;
  status: TaskStatus;
  result?: string;
  filePath?: string;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
};

export type TimelineKind = "call" | "heard" | "spoke" | "task";

export type TimelineEvent = {
  id: string;
  kind: TimelineKind;
  at: number;
  title: string;
  detail?: string;
  taskId?: string;
};
