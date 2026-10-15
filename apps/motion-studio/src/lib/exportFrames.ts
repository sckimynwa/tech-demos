import { seek } from './renderer.ts'
import type { Scene } from './scene.ts'

export async function captureJpegFrames(
  scene: Scene,
  onFrame: (index: number, total: number) => void,
): Promise<ArrayBuffer[]> {
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
  const canvas = document.createElement('canvas')
  canvas.width = scene.width
  canvas.height = scene.height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D unavailable')

  const total = Math.max(1, Math.round(scene.duration * scene.fps))
  const frames: ArrayBuffer[] = []

  for (let i = 0; i < total; i++) {
    seek(ctx, scene, i / scene.fps)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        0.92,
      )
    })
    frames.push(await blob.arrayBuffer())
    onFrame(i + 1, total)
  }

  return frames
}

export function packFrames(frames: ArrayBuffer[]): ArrayBuffer {
  let total = 0
  const bins = frames.map((frame) => {
    const bytes = new Uint8Array(frame)
    total += 4 + bytes.byteLength
    return bytes
  })
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)
  let offset = 0
  for (const bytes of bins) {
    view.setUint32(offset, bytes.byteLength, true)
    offset += 4
    out.set(bytes, offset)
    offset += bytes.byteLength
  }
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
