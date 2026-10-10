export type Modality = "text" | "code" | "image" | "audio"

export type EmbedderKind = "embeddinggemma-2" | "fallback-clip"

export type DeviceKind = "webgpu" | "wasm"

export type LoadProgress = {
  phase: string
  file?: string
  progress: number
  loaded?: number
  total?: number
}

export type EmbedderInfo = {
  id: string
  label: string
  kind: EmbedderKind
  device: DeviceKind
  modalities: Modality[]
  note: string
  isFallback: boolean
  downloadHint: string
}

export type TextRole = "query" | "document"

export type EmbedTextOptions = {
  title?: string
  isCode?: boolean
}

export type Embedder = EmbedderInfo & {
  embedText: (
    text: string,
    role: TextRole,
    opts?: EmbedTextOptions,
  ) => Promise<Float32Array>
  embedImage: (source: string | Blob) => Promise<Float32Array>
  embedAudio: (source: string | Blob) => Promise<Float32Array>
}

export type CorpusItem = {
  id: string
  title: string
  modality: Modality
  source: "sample" | "user"
  text?: string
  url: string
  embedding?: Float32Array
  skippedReason?: string
}

export type SearchHit = {
  item: CorpusItem
  score: number
}

export type Point2D = {
  id: string
  title: string
  x: number
  y: number
  modality: Modality | "query"
}
