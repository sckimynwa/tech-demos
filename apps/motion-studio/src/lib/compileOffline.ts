import { normalizeScene, type Layer, type Scene } from './scene.ts'
import {
  SAMPLE_BUILDERS,
  SAMPLE_PROMPTS,
  beatScene,
  launchScene,
  lockupScene,
  showreelScene,
} from './samples.ts'

const HEX = /#([0-9a-fA-F]{6})\b/
const DURATION = /(\d+(?:\.\d+)?)\s*(?:s|sec|secs|second|seconds)\b/i
const QUOTED = /[“"]([^”"]{1,40})[”"]/

export type CompileResult = {
  scene: Scene
  source: 'sample' | 'openai' | 'anthropic'
  model?: string
}

export function pickSampleId(prompt: string): keyof typeof SAMPLE_BUILDERS {
  const p = prompt.toLowerCase()
  if (/beat|bpm|grid|music|tempo/.test(p)) return 'beat'
  if (/logo|lockup|wordmark/.test(p)) return 'lockup'
  if (/launch|product|saas|startup|ship/.test(p)) return 'launch'
  if (/showreel|résumé|resume|demo reel|motion designer/.test(p)) return 'showreel'
  return 'showreel'
}

export function extractBrief(prompt: string): {
  title?: string
  accent?: string
  duration?: number
} {
  const quoted = prompt.match(QUOTED)
  const hex = prompt.match(HEX)
  const dur = prompt.match(DURATION)
  const titleMatch =
    quoted?.[1] ??
    prompt.match(/\bfor\s+([A-Z][\w .-]{1,24})/)?.[1] ??
    prompt.match(/\blockup for\s+[“"]?([A-Za-z0-9 .-]{1,20})/i)?.[1]
  return {
    title: titleMatch?.trim(),
    accent: hex ? `#${hex[1]}` : undefined,
    duration: dur ? Number(dur[1]) : undefined,
  }
}

export function applyBrief(scene: Scene, brief: ReturnType<typeof extractBrief>): Scene {
  const next = structuredClone(scene)
  if (brief.accent) {
    const prev = next.accent
    next.accent = brief.accent
    next.layers = next.layers.map((layer) => recolor(layer, prev, brief.accent!))
  }
  if (brief.title) {
    next.title = brief.title
    stampTitle(next, brief.title)
  }
  if (brief.duration && brief.duration > 1 && brief.duration !== next.duration) {
    const scale = brief.duration / next.duration
    next.duration = brief.duration
    next.layers = next.layers.map((layer) => ({
      ...layer,
      from: layer.from * scale,
      to: layer.to * scale,
    }))
    next.shots = next.shots.map((shot) => ({ ...shot, t: shot.t * scale }))
  }
  return next
}

function recolor(layer: Layer, from: string, to: string): Layer {
  if ('fill' in layer && layer.fill === from) return { ...layer, fill: to }
  if (layer.kind === 'cells') return { ...layer, accent: to }
  return layer
}

function stampTitle(scene: Scene, title: string): void {
  const upper = title.toUpperCase()
  if (scene.id === 'lockup') {
    const rebuilt = applyBrief(lockupScene(upper), { accent: scene.accent })
    scene.layers = rebuilt.layers
    return
  }
  if (scene.id === 'launch') {
    const brand = scene.layers.find((layer) => layer.id === 'brand')
    if (brand && brand.kind === 'text') brand.text = upper.slice(0, 22)
    return
  }
  if (scene.id === 'showreel') {
    const opus = scene.layers.find((layer) => layer.id === 'opus')
    if (opus && opus.kind === 'text') opus.text = upper.slice(0, 12)
  }
}

export function compileOffline(prompt: string): CompileResult {
  const trimmed = prompt.trim()
  const brief = extractBrief(trimmed)
  const id = pickSampleId(trimmed)
  const builder = SAMPLE_BUILDERS[id]
  const title = brief.title
  const scene = applyBrief(builder(title), brief)
  return { scene: normalizeScene(scene), source: 'sample' }
}

export function defaultPrompt(): string {
  return SAMPLE_PROMPTS[0].prompt
}

export function defaultScene(): Scene {
  return showreelScene()
}

export { beatScene, launchScene, lockupScene, showreelScene, SAMPLE_PROMPTS }

/** Used by inspector to count visible layers at t. */
export function visibleLayerCount(scene: Scene, t: number): number {
  return scene.layers.filter((layer) => t >= layer.from && t < layer.to).length
}
