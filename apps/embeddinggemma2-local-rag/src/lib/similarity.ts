export function l2Normalize(vec: Float32Array): Float32Array {
  let sumSq = 0
  for (let i = 0; i < vec.length; i++) {
    const v = vec[i] ?? 0
    sumSq += v * v
  }
  const norm = Math.sqrt(sumSq)
  if (norm === 0 || !Number.isFinite(norm)) {
    return new Float32Array(vec.length)
  }
  const out = new Float32Array(vec.length)
  const inv = 1 / norm
  for (let i = 0; i < vec.length; i++) {
    out[i] = (vec[i] ?? 0) * inv
  }
  return out
}

/** Cosine similarity. Vectors should already be L2-normalized; we still guard. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length)
  if (n === 0 || a.length !== b.length) {
    throw new Error(
      `Refusing to score vectors of different length (${a.length} vs ${b.length})`,
    )
  }
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i++) {
    const av = a[i] ?? 0
    const bv = b[i] ?? 0
    dot += av * bv
    na += av * av
    nb += bv * bv
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  if (denom === 0 || !Number.isFinite(denom)) return 0
  const score = dot / denom
  if (!Number.isFinite(score)) return 0
  return score
}

export function rankByCosine(
  query: Float32Array,
  items: { id: string; embedding: Float32Array }[],
): { id: string; score: number }[] {
  return items
    .map((item) => ({ id: item.id, score: cosineSimilarity(query, item.embedding) }))
    .sort((a, b) => b.score - a.score)
}
