import { MAX_UPLOAD_BYTES, MODEL_ID } from "../src/domains/transcribe/constants"
import type { SttErrorResponse, StatusResponse } from "../src/domains/transcribe/types"
import { hasLiveKey, parseOptions, TranscribeError, transcribeFile } from "./transcribe"

const API_PORT = Number(process.env.API_PORT ?? 3001)

function errorResponse(message: string, status: number) {
  return Response.json({ error: message } satisfies SttErrorResponse, { status })
}

Bun.serve({
  port: API_PORT,
  idleTimeout: 120,
  routes: {
    "/api/status": () =>
      Response.json({
        mode: hasLiveKey() ? "live" : "demo",
        model: MODEL_ID,
      } satisfies StatusResponse),
    "/api/transcribe": {
      POST: async (request) => {
        const form = await request.formData().catch(() => null)
        if (!form) return errorResponse("Expected multipart form data", 400)

        const file = form.get("file")
        if (!(file instanceof File) || file.size === 0) {
          return errorResponse('Missing audio "file"', 400)
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          return errorResponse(`File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB playground limit`, 413)
        }

        try {
          return Response.json(await transcribeFile(file, parseOptions(form)))
        } catch (error) {
          const status = error instanceof TranscribeError ? error.status : 500
          console.error("[transcribe]", error)
          return errorResponse((error as Error).message, status)
        }
      },
    },
  },
})

console.log(`[api] listening on http://localhost:${API_PORT}`)
console.log(`[api] mode: ${hasLiveKey() ? "live" : "demo (XAI_API_KEY unset)"} · model ${MODEL_ID}`)
