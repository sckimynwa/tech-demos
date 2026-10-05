export const APP_TITLE = "Dots-style voice agent";

export const RESEARCH_DURATION_MS = 2800;
export const SUMMARY_DURATION_MS = 2200;
export const FILE_WRITE_DURATION_MS = 1600;
export const SPEAK_LEAD_IN_MS = 180;
export const MOCK_THINK_MS = 420;

export const REALTIME_CALLS_URL = "https://api.openai.com/v1/realtime/calls";

export const TASK_KINDS = ["research", "summary", "file_write"] as const;

export const SAMPLE_UTTERANCES = [
  {
    label: "Research",
    text: "Research Bun versus Node performance for a Vite app and come back when you have it.",
  },
  {
    label: "Summarize",
    text: "Summarize last week's standup notes while I keep talking.",
  },
  {
    label: "Write file",
    text: "Write a file with today's priorities: ship the voice demo, then queue two more tasks.",
  },
] as const;
