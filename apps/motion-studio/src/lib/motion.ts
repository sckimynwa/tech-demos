export const DEFAULT_SPRING_K = 170
export const DEFAULT_SPRING_D = 26
export const SNAPPY_SPRING_K = 280
export const SNAPPY_SPRING_D = 24
export const HEAVY_SPRING_K = 90
export const HEAVY_SPRING_D = 18

export function clamp(n: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, n))
}

export function loopT(t: number, duration: number): number {
  if (duration <= 0) return 0
  return ((t % duration) + duration) % duration
}

/** Closed-form unit-step spring. Pure function of time — no simulation state. */
export function spring(t: number, k = DEFAULT_SPRING_K, d = DEFAULT_SPRING_D): number {
  if (t <= 0) return 0
  const omega = Math.sqrt(k)
  const zeta = d / (2 * Math.sqrt(k))
  if (zeta < 1) {
    const wd = omega * Math.sqrt(1 - zeta * zeta)
    return (
      1 -
      Math.exp(-zeta * omega * t) *
        (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t))
    )
  }
  return 1 - Math.exp(-omega * t) * (1 + omega * t)
}

export type ScalarTrack = {
  keys: Array<[t: number, value: number]>
  k?: number
  d?: number
}

export function evalTrack(t: number, track: ScalarTrack): number {
  const keys = track.keys
  if (keys.length === 0) return 0
  const k = track.k ?? DEFAULT_SPRING_K
  const d = track.d ?? DEFAULT_SPRING_D
  let value = keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    value += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d)
  }
  return value
}

export function step(
  at: number,
  from: number,
  to: number,
  k = DEFAULT_SPRING_K,
  d = DEFAULT_SPRING_D,
): ScalarTrack {
  return { keys: [[at - 0.0008, from], [at, to]], k, d }
}

export function hold(value: number): ScalarTrack {
  return { keys: [[0, value]] }
}

export function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function formatTimecode(t: number): string {
  const clamped = Math.max(0, t)
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`
}
