import {
  FILE_WRITE_DURATION_MS,
  RESEARCH_DURATION_MS,
  SUMMARY_DURATION_MS,
} from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { AgentTask, TaskKind } from "./types";

export function durationForKind(kind: TaskKind) {
  if (kind === "summary") {
    return SUMMARY_DURATION_MS;
  }
  if (kind === "file_write") {
    return FILE_WRITE_DURATION_MS;
  }
  return RESEARCH_DURATION_MS;
}

export function runMockTask(task: AgentTask): AgentTask {
  if (task.kind === "summary") {
    return {
      ...task,
      status: "done",
      result: mockSummary(task.query),
      finishedAt: Date.now(),
    };
  }
  if (task.kind === "file_write") {
    const filePath = `notes/${slugify(task.query)}.md`;
    return {
      ...task,
      status: "done",
      filePath,
      result: mockFile(task.query, filePath),
      finishedAt: Date.now(),
    };
  }
  return {
    ...task,
    status: "done",
    result: mockResearch(task.query),
    finishedAt: Date.now(),
  };
}

function mockResearch(query: string) {
  return [
    `Top takeaways for “${query}”:`,
    "1) The interesting split is startup vs steady-state — pick the runtime for the job, not the tweet.",
    "2) Vite's dev loop cares more about module graph + HMR than raw server RPS.",
    "3) Mock sources: official runtime docs, two recent posts, one benchmark caveat.",
    "This is a simulated research result — no live web fetch in the no-key path.",
  ].join(" ");
}

function mockSummary(query: string) {
  return [
    `Summary of “${query}”:`,
    "Ship the voice loop first. Keep the call open. Queue work instead of blocking the line.",
    "Speak completions first so the human does not have to watch a panel.",
    "Open questions: real tools vs mocks, and whether proactive pings should wait for silence.",
  ].join(" ");
}

function mockFile(query: string, filePath: string) {
  return `Wrote ${filePath} (mock workspace). Contents: # Note\n\n${query}\n\n- queued from the always-on call\n- agent will speak this path first`;
}
