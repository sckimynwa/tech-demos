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

export const SAMPLE_UTTERANCES_KO = [
  {
    label: "조사",
    text: "번과 노드 성능을 조사해서 끝나면 먼저 말해줘.",
  },
  {
    label: "요약",
    text: "지난주 스탠드업 노트를 요약해 줘. 나는 계속 말할게.",
  },
  {
    label: "파일",
    text: "오늘 우선순위를 파일로 적어 줘. 보이스 데모부터.",
  },
] as const;

export const MODE_STORAGE_KEY = "dots-voice-mode";

export const DEFAULT_SILENCE_S = 60;
export const DEFAULT_MAX_SESSION_S = 600;
