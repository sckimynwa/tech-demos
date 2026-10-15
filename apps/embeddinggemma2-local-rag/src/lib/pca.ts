import type { Point2D } from "./types"
import type { Modality } from "./types"

const MAP_PAD = 0.1
const POWER_ITERS = 40

function powerIteration(
  rows: Float64Array[],
  dim: number,
  exclude: Float64Array | null,
): Float64Array {
  const v = new Float64Array(dim)
  for (let i = 0; i < dim; i++) {
    v[i] = Math.sin(i * 12.9898) * 0.5 + 0.5
  }
  if (exclude) {
    projectOut(v, exclude)
  }
  normalizeInPlace(v)

  const tmp = new Float64Array(dim)
  for (let iter = 0; iter < POWER_ITERS; iter++) {
    tmp.fill(0)
    for (const row of rows) {
      let dot = 0
      for (let i = 0; i < dim; i++) {
        dot += (row[i] ?? 0) * (v[i] ?? 0)
      }
      for (let i = 0; i < dim; i++) {
        tmp[i] = (tmp[i] ?? 0) + (row[i] ?? 0) * dot
      }
    }
    if (exclude) {
      projectOut(tmp, exclude)
    }
    normalizeInPlace(tmp)
    v.set(tmp)
  }
  return v
}

function projectOut(v: Float64Array, axis: Float64Array) {
  let dot = 0
  for (let i = 0; i < v.length; i++) {
    dot += (v[i] ?? 0) * (axis[i] ?? 0)
  }
  for (let i = 0; i < v.length; i++) {
    v[i] = (v[i] ?? 0) - dot * (axis[i] ?? 0)
  }
}

function normalizeInPlace(v: Float64Array) {
  let sumSq = 0
  for (let i = 0; i < v.length; i++) {
    const x = v[i] ?? 0
    sumSq += x * x
  }
  const norm = Math.sqrt(sumSq)
  if (norm === 0) return
  const inv = 1 / norm
  for (let i = 0; i < v.length; i++) {
    v[i] = (v[i] ?? 0) * inv
  }
}

export function projectTo2D(
  items: { id: string; title: string; embedding: Float32Array; modality: Modality | "query" }[],
): Point2D[] {
  if (items.length === 0) return []
  const dim = items[0]?.embedding.length ?? 0
  if (dim === 0) return []

  const mean = new Float64Array(dim)
  for (const item of items) {
    for (let i = 0; i < dim; i++) {
      mean[i] = (mean[i] ?? 0) + (item.embedding[i] ?? 0)
    }
  }
  const invN = 1 / items.length
  for (let i = 0; i < dim; i++) {
    mean[i] = (mean[i] ?? 0) * invN
  }

  const rows = items.map((item) => {
    const row = new Float64Array(dim)
    for (let i = 0; i < dim; i++) {
      row[i] = (item.embedding[i] ?? 0) - (mean[i] ?? 0)
    }
    return row
  })

  if (items.length === 1) {
    return [{ id: items[0]!.id, title: items[0]!.title, x: 0.5, y: 0.5, modality: items[0]!.modality }]
  }

  const pc1 = powerIteration(rows, dim, null)
  const pc2 = powerIteration(rows, dim, pc1)

  const raw = rows.map((row) => {
    let x = 0
    let y = 0
    for (let i = 0; i < dim; i++) {
      x += (row[i] ?? 0) * (pc1[i] ?? 0)
      y += (row[i] ?? 0) * (pc2[i] ?? 0)
    }
    return { x, y }
  })

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of raw) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const scale = 1 - MAP_PAD * 2

  return items.map((item, i) => {
    const p = raw[i] ?? { x: 0, y: 0 }
    return {
      id: item.id,
      title: item.title,
      x: MAP_PAD + ((p.x - minX) / spanX) * scale,
      y: MAP_PAD + ((p.y - minY) / spanY) * scale,
      modality: item.modality,
    }
  })
}
