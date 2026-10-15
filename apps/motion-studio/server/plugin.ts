import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { encodeMp4 } from './exportMp4.ts'
import { compileWithLlm } from './llm.ts'

const MAX_EXPORT_BYTES = 80 * 1024 * 1024

export function motionApi(): Plugin {
  return {
    name: 'motion-studio-api',
    configureServer(server) {
      server.middlewares.use('/api/compile', (req, res) => {
        void handleCompile(req, res)
      })
      server.middlewares.use('/api/export', (req, res) => {
        void handleExport(req, res)
      })
    },
  }
}

async function handleCompile(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'POST only' })
    return
  }
  try {
    const body = JSON.parse((await readBody(req)).toString('utf8')) as { prompt?: string }
    const prompt = body.prompt?.trim() ?? ''
    if (!prompt) {
      json(res, 400, { error: 'prompt required' })
      return
    }
    const llm = await compileWithLlm(prompt)
    if (llm) {
      json(res, 200, llm)
      return
    }
    json(res, 200, { source: 'sample', scene: null })
  } catch (error) {
    json(res, 500, { error: error instanceof Error ? error.message : 'compile failed' })
  }
}

async function handleExport(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'POST only' })
    return
  }
  try {
    const fps = Number(req.headers['x-fps'] ?? 30)
    const body = await readBody(req, MAX_EXPORT_BYTES)
    const frames = parsePackedFrames(body)
    if (frames.length === 0) {
      json(res, 400, { error: 'no frames' })
      return
    }
    const mp4 = await encodeMp4(frames, Number.isFinite(fps) ? fps : 30)
    res.statusCode = 200
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', 'attachment; filename="motion-studio.mp4"')
    res.end(mp4)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'export failed'
    json(res, 500, { error: message })
  }
}

function parsePackedFrames(buf: Buffer): Buffer[] {
  const frames: Buffer[] = []
  let offset = 0
  while (offset + 4 <= buf.length) {
    const length = buf.readUInt32LE(offset)
    offset += 4
    if (length <= 0 || offset + length > buf.length) {
      throw new Error('truncated frame pack')
    }
    frames.push(buf.subarray(offset, offset + length))
    offset += length
  }
  return frames
}

function readBody(req: IncomingMessage, max = 2 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > max) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
