export const MODEL_ID = "grok-voice-transcribe-2.0"
export const XAI_STT_URL = "https://api.x.ai/v1/stt"
export const API_PORT = 3001
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const WAVEFORM_BAR_COUNT = 36
export const RECORDER_TIMESLICE_MS = 250
export const SAMPLE_CLIP_PATH = "/sample-meeting.wav"
export const SAMPLE_CLIP_NAME = "sample-meeting.wav"
export const DEFAULT_TRANSCRIBE_DELAY_MS = 650

export const LANGUAGE_OPTIONS = [
  { value: "", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
  { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" },
] as const

export const SPEAKER_COLORS = [
  "bg-amber-400/20 text-amber-200 ring-amber-400/40",
  "bg-sky-400/20 text-sky-200 ring-sky-400/40",
  "bg-emerald-400/20 text-emerald-200 ring-emerald-400/40",
  "bg-fuchsia-400/20 text-fuchsia-200 ring-fuchsia-400/40",
] as const
