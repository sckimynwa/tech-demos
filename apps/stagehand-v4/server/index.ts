import type { ExtractErrorResponse, ExtractRequest } from '../src/domains/extract/types'
import { resolveChromePath } from './chrome'
import { InvalidUrlError, runExtract } from './extract'
import { resolveModel } from './model'

const API_PORT = Number(process.env.API_PORT ?? 3001)

function errorResponse(message: string, status: number) {
  return Response.json({ error: message } satisfies ExtractErrorResponse, { status })
}

Bun.serve({
  port: API_PORT,
  idleTimeout: 120,
  routes: {
    '/api/health': () => Response.json({ ok: true, model: resolveModel()?.modelName ?? null }),
    '/api/extract': {
      POST: async (request) => {
        const body = (await request.json().catch(() => null)) as ExtractRequest | null
        if (!body?.url) return errorResponse('Missing "url"', 400)
        try {
          return Response.json(await runExtract(body))
        } catch (error) {
          const status = error instanceof InvalidUrlError ? 400 : 500
          console.error('[extract]', error)
          return errorResponse((error as Error).message, status)
        }
      },
    },
  },
})

console.log(`[api] listening on http://localhost:${API_PORT}`)
console.log(`[api] LLM extract: ${resolveModel()?.modelName ?? 'disabled (no model key set)'}`)

resolveChromePath().catch((error) => console.error('[chrome] setup failed:', error))
