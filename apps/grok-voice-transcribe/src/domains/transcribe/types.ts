export type SttWord = {
  text: string
  start: number
  end: number
  speaker?: number
}

export type SttResult = {
  text: string
  language: string
  duration: number
  words: SttWord[]
  mode: "live" | "demo"
  model: string
}

export type SttErrorResponse = {
  error: string
}

export type StatusResponse = {
  mode: "live" | "demo"
  model: string
}

export type TranscribeOptions = {
  diarize: boolean
  format: boolean
  fillerWords: boolean
  language: string
  keyterms: string[]
}
