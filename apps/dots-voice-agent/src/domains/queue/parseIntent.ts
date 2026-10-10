import type { TaskKind } from "./types";

const FILE_RE = /\b(write|save|draft|file|memo|priorit)/i;
const SUMMARY_RE =
  /\b(summar(y|ize|ise)|recap|tldr|tl;dr|condense|digest)\b/i;
const RESEARCH_RE =
  /\b(research|look up|lookup|search|investigate|find out|what is|compare|versus|vs\.?)\b/i;

export function parseTaskKind(utterance: string): TaskKind {
  if (SUMMARY_RE.test(utterance)) {
    return "summary";
  }
  if (FILE_RE.test(utterance)) {
    return "file_write";
  }
  if (RESEARCH_RE.test(utterance)) {
    return "research";
  }
  return "research";
}

export function confirmationLine(kind: TaskKind, query: string) {
  if (kind === "summary") {
    return `On it. I'll summarize ${trimForSpeech(query)} in the background and speak when it's ready.`;
  }
  if (kind === "file_write") {
    return `Queued. I'll write that file and tell you first when it's saved.`;
  }
  return `On it. Researching ${trimForSpeech(query)} in the background — I'll jump in when it lands.`;
}

export function completionLead(kind: TaskKind) {
  if (kind === "summary") {
    return "Summary ready.";
  }
  if (kind === "file_write") {
    return "File written.";
  }
  return "Research done.";
}

function trimForSpeech(query: string) {
  const compact = query.replace(/\s+/g, " ").trim();
  if (compact.length <= 72) {
    return compact;
  }
  return `${compact.slice(0, 69)}…`;
}
