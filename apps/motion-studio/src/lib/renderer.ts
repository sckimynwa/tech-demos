import { clamp, evalTrack, loopT, mulberry32 } from './motion.ts'
import type { Layer, Scene } from './scene.ts'

const FONT_DISPLAY = '"Fraunces", "Times New Roman", serif'
const FONT_MONO = '"IBM Plex Mono", ui-monospace, monospace'
const FONT_SANS = '"IBM Plex Sans", system-ui, sans-serif'

function fontFamily(face: 'display' | 'mono' | 'sans'): string {
  if (face === 'mono') return FONT_MONO
  if (face === 'sans') return FONT_SANS
  return FONT_DISPLAY
}

export function seek(ctx: CanvasRenderingContext2D, scene: Scene, t: number): void {
  const time = loopT(t, scene.duration)
  const { width: W, height: H } = scene

  ctx.save()
  ctx.fillStyle = scene.background
  ctx.fillRect(0, 0, W, H)

  const zoom = evalTrack(time, scene.camera.zoom)
  const camX = evalTrack(time, scene.camera.x)
  const camY = evalTrack(time, scene.camera.y)
  const camR = evalTrack(time, scene.camera.rotate)

  ctx.translate(W / 2 + camX, H / 2 + camY)
  ctx.rotate((camR * Math.PI) / 180)
  ctx.scale(zoom, zoom)
  ctx.translate(-W / 2, -H / 2)

  for (const layer of scene.layers) {
    if (time < layer.from || time >= layer.to) continue
    const opacity = layer.opacity ? evalTrack(time, layer.opacity) : 1
    if (opacity <= 0.002) continue
    ctx.save()
    ctx.globalAlpha *= clamp(opacity)
    drawLayer(ctx, layer, time, scene)
    ctx.restore()
  }

  ctx.restore()

  if (scene.grain > 0) {
    drawGrain(ctx, W, H, time, scene.grain, scene.fps)
  }
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  t: number,
  scene: Scene,
): void {
  switch (layer.kind) {
    case 'text': {
      const x = evalTrack(t, layer.x)
      const y = evalTrack(t, layer.y)
      const scale = layer.scale ? evalTrack(t, layer.scale) : 1
      const rotate = layer.rotate ? evalTrack(t, layer.rotate) : 0
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate((rotate * Math.PI) / 180)
      ctx.scale(scale, scale)
      ctx.fillStyle = layer.fill
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px ${fontFamily(layer.font)}`
      ctx.textAlign = layer.align ?? 'left'
      ctx.textBaseline = 'middle'
      if (layer.tracking !== undefined && 'letterSpacing' in ctx) {
        ctx.letterSpacing = `${layer.tracking}px`
      }
      ctx.fillText(layer.text, 0, 0)
      ctx.restore()
      return
    }
    case 'box': {
      const x = evalTrack(t, layer.x)
      const y = evalTrack(t, layer.y)
      const w = evalTrack(t, layer.w)
      const h = evalTrack(t, layer.h)
      const scale = layer.scale ? evalTrack(t, layer.scale) : 1
      ctx.save()
      ctx.translate(x + w / 2, y + h / 2)
      ctx.scale(scale, scale)
      ctx.fillStyle = layer.fill
      const r = layer.r ?? 0
      roundRect(ctx, -w / 2, -h / 2, w, h, r)
      ctx.fill()
      ctx.restore()
      return
    }
    case 'rule': {
      const x = evalTrack(t, layer.x)
      const y = evalTrack(t, layer.y)
      const w = Math.max(0, evalTrack(t, layer.w))
      ctx.fillStyle = layer.fill
      ctx.fillRect(x, y, w, layer.h)
      return
    }
    case 'cells': {
      const beat = 60 / layer.bpm
      for (let row = 0; row < layer.rows; row++) {
        for (let col = 0; col < layer.cols; col++) {
          const index = row * layer.cols + col
          const delay = (index % layer.cols) * (beat / layer.cols)
          const local = loopT(t - delay, beat)
          const pulse = 1 + 0.2 * (1 - evalTrack(local, { keys: [[0, 0], [0.0001, 1]], k: 320, d: 28 }))
          const isDown = index % 4 === 0
          const x = layer.x + col * (layer.size + layer.gap)
          const y = layer.y + row * (layer.size + layer.gap)
          const size = layer.size * pulse
          const ox = x - (size - layer.size) / 2
          const oy = y - (size - layer.size) / 2
          ctx.save()
          ctx.fillStyle = isDown ? layer.accent : layer.fill
          ctx.globalAlpha *= isDown ? 0.95 : 0.28 + (pulse - 1) * 1.6
          ctx.fillRect(ox, oy, size, size)
          ctx.restore()
        }
      }
      return
    }
    case 'ticks': {
      const { width } = scene
      const left = 72
      const right = width - 72
      const span = right - left
      ctx.fillStyle = layer.fill
      for (let i = 0; i < layer.count; i++) {
        const x = left + (span * i) / (layer.count - 1)
        const tall = i % 4 === 0
        ctx.globalAlpha = tall ? 0.85 : 0.28
        ctx.fillRect(x, layer.y, 2, tall ? 28 : 14)
      }
      if (layer.playhead) {
        const u = scene.duration > 0 ? t / scene.duration : 0
        ctx.globalAlpha = 1
        ctx.fillStyle = scene.accent
        ctx.fillRect(left + span * u - 2, layer.y - 8, 4, 44)
      }
      return
    }
    default:
      return
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, radius)
    return
  }
  ctx.rect(x, y, w, h)
}

function drawGrain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  amount: number,
  fps: number,
): void {
  const frame = Math.round(t * fps)
  const rng = mulberry32(frame * 9973 + 17)
  ctx.save()
  ctx.globalAlpha = amount
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = rng() > 0.5 ? '#ffffff' : '#000000'
    ctx.fillRect(rng() * w, rng() * h, 1.25, 1.25)
  }
  ctx.restore()
}
