import { MODEL_ID, XAI_STT_URL } from "../src/domains/transcribe/constants"
import type { SttResult, TranscribeOptions } from "../src/domains/transcribe/types"
import { estimateDurationSeconds } from "./audio"
import { buildMockTranscript } from "./mock"

const MAX_KEYTERMS = 20

export function hasLiveKey() {
  return Boolean(process.env.XAI_API_KEY?.trim())
}

export function parseOptions(form: FormData): TranscribeOptions {
  const language = String(form.get("language") ?? "").trim()
  const rawKeyterms = form.getAll("keyterm").flatMap((value) =>
    String(value)
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean),
  )

  return {
    diarize: form.get("diarize") === "true",
    format: form.get("format") === "true",
    fillerWords: form.get("filler_words") === "true",
    language,
    keyterms: rawKeyterms.slice(0, MAX_KEYTERMS),
  }
}

export async function transcribeFile(file: File, options: TranscribeOptions): Promise<SttResult> {
  if (!hasLiveKey()) {
    const duration = await estimateDurationSeconds(file)
    return buildMockTranscript({
      ...options,
      fileName: file.name,
      duration,
    })
  }

  return transcribeLive(file, options)
}

async function transcribeLive(file: File, options: TranscribeOptions): Promise<SttResult> {
  const body = new FormData()
  body.append("model", MODEL_ID)
  if (options.language) body.append("language", options.language)
  if (options.format) {
    body.append("format", "true")
    if (!options.language) body.append("language", "en")
  }
  if (options.diarize) body.append("diarize", "true")
  if (options.fillerWords) body.append("filler_words", "true")
  for (const term of options.keyterms) body.append("keyterm", term)
  body.append("file", file, file.name)

  const response = await fetch(XAI_STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body,
  })

  const payload = (await response.json().catch(() => null)) as
    | (Partial<SttResult> & { error?: string; message?: string })
    | null

  if (!response.ok) {
    const detail = payload?.error ?? payload?.message ?? `xAI STT error ${response.status}`
    throw new TranscribeError(detail, response.status)
  }

  return {
    text: payload?.text ?? "",
    language: payload?.language ?? options.language ?? "und",
    duration: Number(payload?.duration ?? 0),
    words: Array.isArray(payload?.words) ? payload.words : [],
    mode: "live",
    model: MODEL_ID,
  }
}

export class TranscribeError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
