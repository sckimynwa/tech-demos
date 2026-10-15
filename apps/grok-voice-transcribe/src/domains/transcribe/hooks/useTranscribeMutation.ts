import { useMutation } from "@tanstack/react-query"
import type { SttErrorResponse, SttResult, TranscribeOptions } from "../types"

export function useTranscribeMutation() {
  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File
      options: TranscribeOptions
    }): Promise<SttResult> => {
      const form = new FormData()
      form.append("diarize", String(options.diarize))
      form.append("format", String(options.format))
      form.append("filler_words", String(options.fillerWords))
      if (options.language) form.append("language", options.language)
      for (const term of options.keyterms) form.append("keyterm", term)
      form.append("file", file, file.name)

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: form,
      })
      const payload = (await response.json()) as SttResult | SttErrorResponse
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : `Transcribe failed (${response.status})`)
      }
      return payload
    },
  })
}
