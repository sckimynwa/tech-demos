export type ExtractRequest = {
  url: string
  instruction?: string
}

export type ExtractedLink = {
  href: string
  text: string
}

export type LlmExtraction =
  | { status: 'ok'; model: string; extraction: string }
  | { status: 'skipped'; reason: string }
  | { status: 'error'; model: string; message: string }

export type ExtractResponse = {
  url: string
  title: string
  text: string
  textTruncated: boolean
  links: ExtractedLink[]
  accessibilityTree: string
  llm: LlmExtraction | null
  durationMs: number
}

export type ExtractErrorResponse = {
  error: string
}
