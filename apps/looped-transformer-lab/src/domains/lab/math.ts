export function zeros(n: number): Float64Array {
  return new Float64Array(n);
}

export function matmul(
  a: Float64Array,
  aRows: number,
  aCols: number,
  b: Float64Array,
  bCols: number,
): Float64Array {
  const out = new Float64Array(aRows * bCols);
  for (let i = 0; i < aRows; i += 1) {
    for (let k = 0; k < aCols; k += 1) {
      const aik = a[i * aCols + k]!;
      if (aik === 0) continue;
      const brow = k * bCols;
      const orow = i * bCols;
      for (let j = 0; j < bCols; j += 1) {
        out[orow + j] += aik * b[brow + j]!;
      }
    }
  }
  return out;
}

export function addInPlace(target: Float64Array, extra: Float64Array): void {
  for (let i = 0; i < target.length; i += 1) {
    target[i]! += extra[i]!;
  }
}

export function softmaxRow(row: Float64Array, offset: number, width: number): void {
  let max = -Infinity;
  for (let i = 0; i < width; i += 1) {
    const v = row[offset + i]!;
    if (v > max) max = v;
  }
  let sum = 0;
  for (let i = 0; i < width; i += 1) {
    const e = Math.exp(row[offset + i]! - max);
    row[offset + i] = e;
    sum += e;
  }
  const inv = sum === 0 ? 0 : 1 / sum;
  for (let i = 0; i < width; i += 1) {
    row[offset + i]! *= inv;
  }
}

export function rmsNorm(x: Float64Array, dim: number, eps = 1e-5): Float64Array {
  const rows = x.length / dim;
  const out = new Float64Array(x.length);
  for (let r = 0; r < rows; r += 1) {
    const off = r * dim;
    let acc = 0;
    for (let i = 0; i < dim; i += 1) {
      const v = x[off + i]!;
      acc += v * v;
    }
    const inv = 1 / Math.sqrt(acc / dim + eps);
    for (let i = 0; i < dim; i += 1) {
      out[off + i] = x[off + i]! * inv;
    }
  }
  return out;
}

export function relu(x: Float64Array): Float64Array {
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i += 1) {
    const v = x[i]!;
    out[i] = v > 0 ? v : 0;
  }
  return out;
}

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function fillNormal(out: Float64Array, rng: () => number, scale: number): void {
  for (let i = 0; i < out.length; i += 2) {
    const u1 = Math.max(rng(), 1e-12);
    const u2 = rng();
    const mag = scale * Math.sqrt(-2 * Math.log(u1));
    const ang = 2 * Math.PI * u2;
    out[i] = mag * Math.cos(ang);
    if (i + 1 < out.length) out[i + 1] = mag * Math.sin(ang);
  }
}
