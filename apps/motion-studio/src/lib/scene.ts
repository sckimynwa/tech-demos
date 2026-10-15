import { hold, type ScalarTrack } from './motion.ts'

export const SCENE_WIDTH = 1280
export const SCENE_HEIGHT = 720
export const SCENE_FPS = 30

export type FontFace = 'display' | 'mono' | 'sans'

export type LayerBase = {
  id: string
  from: number
  to: number
  opacity?: ScalarTrack
}

export type TextLayer = LayerBase & {
  kind: 'text'
  text: string
  x: ScalarTrack
  y: ScalarTrack
  scale?: ScalarTrack
  rotate?: ScalarTrack
  fontSize: number
  fontWeight: number
  font: FontFace
  fill: string
  align?: CanvasTextAlign
  tracking?: number
}

export type BoxLayer = LayerBase & {
  kind: 'box'
  x: ScalarTrack
  y: ScalarTrack
  w: ScalarTrack
  h: ScalarTrack
  r?: number
  fill: string
  scale?: ScalarTrack
}

export type RuleLayer = LayerBase & {
  kind: 'rule'
  x: ScalarTrack
  y: ScalarTrack
  w: ScalarTrack
  h: number
  fill: string
}

export type CellsLayer = LayerBase & {
  kind: 'cells'
  x: number
  y: number
  cols: number
  rows: number
  size: number
  gap: number
  bpm: number
  fill: string
  accent: string
}

export type TicksLayer = LayerBase & {
  kind: 'ticks'
  y: number
  count: number
  fill: string
  playhead: boolean
}

export type Layer = TextLayer | BoxLayer | RuleLayer | CellsLayer | TicksLayer

export type Shot = { t: number; label: string }

export type Scene = {
  id: string
  title: string
  width: number
  height: number
  fps: number
  duration: number
  background: string
  accent: string
  ink: string
  grain: number
  camera: {
    zoom: ScalarTrack
    x: ScalarTrack
    y: ScalarTrack
    rotate: ScalarTrack
  }
  layers: Layer[]
  shots: Shot[]
}

export function defaultCamera() {
  return {
    zoom: hold(1),
    x: hold(0),
    y: hold(0),
    rotate: hold(0),
  }
}

export function emptyScene(): Scene {
  return {
    id: 'empty',
    title: 'Untitled',
    width: SCENE_WIDTH,
    height: SCENE_HEIGHT,
    fps: SCENE_FPS,
    duration: 6,
    background: '#0c0c0e',
    accent: '#d6ff3d',
    ink: '#f4f1ea',
    grain: 0.07,
    camera: defaultCamera(),
    layers: [],
    shots: [],
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function normalizeScene(raw: unknown): Scene {
  const base = emptyScene()
  if (!isRecord(raw)) return base
  const cameraRaw = isRecord(raw.camera) ? raw.camera : {}
  const layers = Array.isArray(raw.layers) ? (raw.layers as Layer[]) : []
  const shots = Array.isArray(raw.shots) ? (raw.shots as Shot[]) : []
  return {
    id: typeof raw.id === 'string' ? raw.id : base.id,
    title: typeof raw.title === 'string' ? raw.title : base.title,
    width: num(raw.width, base.width),
    height: num(raw.height, base.height),
    fps: num(raw.fps, base.fps),
    duration: num(raw.duration, base.duration),
    background: str(raw.background, base.background),
    accent: str(raw.accent, base.accent),
    ink: str(raw.ink, base.ink),
    grain: num(raw.grain, base.grain),
    camera: {
      zoom: asTrack(cameraRaw.zoom, base.camera.zoom),
      x: asTrack(cameraRaw.x, base.camera.x),
      y: asTrack(cameraRaw.y, base.camera.y),
      rotate: asTrack(cameraRaw.rotate, base.camera.rotate),
    },
    layers,
    shots,
  }
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function str(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function asTrack(value: unknown, fallback: ScalarTrack): ScalarTrack {
  if (!isRecord(value) || !Array.isArray(value.keys) || value.keys.length === 0) {
    return fallback
  }
  return value as ScalarTrack
}
