import type { SttResult, SttWord, TranscribeOptions } from "../src/domains/transcribe/types"
import { MODEL_ID } from "../src/domains/transcribe/constants"

type ScriptToken = {
  spoken: string
  written: string
  filler?: boolean
}

type ScriptTurn = {
  speaker: number
  tokens: ScriptToken[]
}

const ENGLISH_SCRIPT: ScriptTurn[] = [
  {
    speaker: 0,
    tokens: [
      { spoken: "Hey,", written: "Hey," },
      { spoken: "did", written: "did" },
      { spoken: "you", written: "you" },
      { spoken: "see", written: "see" },
      { spoken: "Grok", written: "Grok" },
      { spoken: "Voice", written: "Voice" },
      { spoken: "Transcribe", written: "Transcribe" },
      { spoken: "two", written: "2.0" },
      { spoken: "point", written: "2.0" },
      { spoken: "oh", written: "2.0" },
      { spoken: "just", written: "just" },
      { spoken: "dropped?", written: "dropped?" },
    ],
  },
  {
    speaker: 1,
    tokens: [
      { spoken: "um", written: "um", filler: true },
      { spoken: "Yeah.", written: "Yeah." },
      { spoken: "Artificial", written: "Artificial" },
      { spoken: "Analysis", written: "Analysis" },
      { spoken: "ranks", written: "ranks" },
      { spoken: "it", written: "it" },
      { spoken: "number", written: "number" },
      { spoken: "one", written: "1" },
      { spoken: "of", written: "of" },
      { spoken: "thirty-two", written: "32" },
      { spoken: "streaming", written: "streaming" },
      { spoken: "models.", written: "models." },
    ],
  },
  {
    speaker: 0,
    tokens: [
      { spoken: "Same", written: "Same" },
      { spoken: "price", written: "price" },
      { spoken: "as", written: "as" },
      { spoken: "one", written: "1.0" },
      { spoken: "point", written: "1.0" },
      { spoken: "oh", written: "1.0" },
      { spoken: "—", written: "—" },
      { spoken: "ten", written: "$0.10" },
      { spoken: "cents", written: "$0.10" },
      { spoken: "an", written: "an" },
      { spoken: "hour", written: "hour" },
      { spoken: "batch,", written: "batch," },
      { spoken: "and", written: "and" },
      { spoken: "it", written: "it" },
      { spoken: "auto-detects", written: "auto-detects" },
      { spoken: "language.", written: "language." },
    ],
  },
  {
    speaker: 1,
    tokens: [
      { spoken: "uh", written: "uh", filler: true },
      { spoken: "Bias", written: "Bias" },
      { spoken: "the", written: "the" },
      { spoken: "decoder", written: "decoder" },
      { spoken: "with", written: "with" },
      { spoken: "SpaceXAI.", written: "SpaceXAI." },
      { spoken: "The", written: "The" },
      { spoken: "balance", written: "balance" },
      { spoken: "is", written: "is" },
      { spoken: "one", written: "$167,000." },
      { spoken: "hundred", written: "$167,000." },
      { spoken: "sixty-seven", written: "$167,000." },
      { spoken: "thousand", written: "$167,000." },
      { spoken: "dollars.", written: "$167,000." },
    ],
  },
]

const KOREAN_SCRIPT: ScriptTurn[] = [
  {
    speaker: 0,
    tokens: [
      { spoken: "속보:", written: "속보:" },
      { spoken: "SpaceXAI가", written: "SpaceXAI가" },
      { spoken: "Grok", written: "Grok" },
      { spoken: "Voice", written: "Voice" },
      { spoken: "Transcribe", written: "Transcribe" },
      { spoken: "2.0을", written: "2.0을" },
      { spoken: "출시했습니다.", written: "출시했습니다." },
    ],
  },
  {
    speaker: 1,
    tokens: [
      { spoken: "정확도가", written: "정확도가" },
      { spoken: "두", written: "2" },
      { spoken: "배로", written: "배로" },
      { spoken: "올랐고", written: "올랐고" },
      { spoken: "가격은", written: "가격은" },
      { spoken: "그대로예요.", written: "그대로예요." },
    ],
  },
]

const SPANISH_SCRIPT: ScriptTurn[] = [
  {
    speaker: 0,
    tokens: [
      { spoken: "Oye,", written: "Oye," },
      { spoken: "¿ya", written: "¿ya" },
      { spoken: "viste", written: "viste" },
      { spoken: "Grok", written: "Grok" },
      { spoken: "Voice", written: "Voice" },
      { spoken: "Transcribe", written: "Transcribe" },
      { spoken: "dos", written: "2.0" },
      { spoken: "punto", written: "2.0" },
      { spoken: "cero?", written: "2.0?" },
    ],
  },
  {
    speaker: 1,
    tokens: [
      { spoken: "Sí.", written: "Sí." },
      { spoken: "Detecta", written: "Detecta" },
      { spoken: "el", written: "el" },
      { spoken: "idioma", written: "idioma" },
      { spoken: "solo", written: "solo" },
      { spoken: "y", written: "y" },
      { spoken: "etiqueta", written: "etiqueta" },
      { spoken: "hablantes.", written: "hablantes." },
    ],
  },
]

const FORMAT_GROUPS = new Set(["2.0", "2.0?", "1.0", "32", "1", "$0.10", "$167,000."])

export function detectLanguage(fileName: string, requested: string): string {
  if (requested) return requested
  const lower = fileName.toLowerCase()
  if (/(^|[^a-z])(ko|kr|korean|한글)([^a-z]|$)/.test(lower)) return "ko"
  if (/(^|[^a-z])(es|spanish|espanol|español)([^a-z]|$)/.test(lower)) return "es"
  if (/(^|[^a-z])(ja|jp|japanese)([^a-z]|$)/.test(lower)) return "ja"
  if (/(^|[^a-z])(fr|french)([^a-z]|$)/.test(lower)) return "fr"
  return "en"
}

function scriptForLanguage(language: string): ScriptTurn[] {
  if (language.startsWith("ko")) return KOREAN_SCRIPT
  if (language.startsWith("es")) return SPANISH_SCRIPT
  return ENGLISH_SCRIPT
}

function collapseFormatted(tokens: ScriptToken[]): ScriptToken[] {
  const collapsed: ScriptToken[] = []
  for (const token of tokens) {
    const previous = collapsed.at(-1)
    if (previous && FORMAT_GROUPS.has(token.written) && previous.written === token.written) {
      continue
    }
    collapsed.push(token)
  }
  return collapsed
}

export function buildMockTranscript(
  options: TranscribeOptions & { fileName: string; duration: number },
): SttResult {
  const language = detectLanguage(options.fileName, options.language)
  const script = scriptForLanguage(language)
  const words: SttWord[] = []
  const usableDuration = Math.max(options.duration, 6)
  const selectedTurns = script.flatMap((turn) => {
    const tokens = turn.tokens.filter((token) => options.fillerWords || !token.filler)
    const resolved = options.format ? collapseFormatted(tokens) : tokens
    return resolved.map((token) => ({
      speaker: turn.speaker,
      text: options.format ? token.written : token.spoken,
    }))
  })

  const keyterms = options.keyterms.map((term) => term.trim()).filter(Boolean)
  if (keyterms.length > 0) {
    selectedTurns.push({
      speaker: 0,
      text: keyterms[0]!,
    })
  }

  const slice = usableDuration / Math.max(selectedTurns.length, 1)
  for (const [index, token] of selectedTurns.entries()) {
    const start = round2(index * slice)
    const end = round2(Math.min(usableDuration, start + slice * 0.85))
    const word: SttWord = { text: token.text, start, end }
    if (options.diarize) word.speaker = token.speaker
    words.push(word)
  }

  return {
    text: words.map((word) => word.text).join(" "),
    language,
    duration: round2(usableDuration),
    words,
    mode: "demo",
    model: MODEL_ID,
  }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
