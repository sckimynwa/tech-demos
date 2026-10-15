import {
  ADD_SEQ_LEN,
  BENCH_REPEATS,
  D_FF,
  D_HEAD,
  D_MODEL,
  MAZE_SIZE,
  N_HEADS,
  VOCAB_SIZE,
} from "./constants";
import {
  addInPlace,
  fillNormal,
  matmul,
  mulberry32,
  relu,
  rmsNorm,
  softmaxRow,
  zeros,
} from "./math";

export type SharedWeights = {
  embed: Float64Array;
  wq: Float64Array;
  wk: Float64Array;
  wv: Float64Array;
  wo: Float64Array;
  w1: Float64Array;
  w2: Float64Array;
};

let cached: SharedWeights | null = null;

export function sharedWeights(): SharedWeights {
  if (cached) return cached;
  const rng = mulberry32(0x6c6f6f70);
  const embed = zeros(VOCAB_SIZE * D_MODEL);
  const wq = zeros(D_MODEL * D_MODEL);
  const wk = zeros(D_MODEL * D_MODEL);
  const wv = zeros(D_MODEL * D_MODEL);
  const wo = zeros(D_MODEL * D_MODEL);
  const w1 = zeros(D_MODEL * D_FF);
  const w2 = zeros(D_FF * D_MODEL);
  const scale = 1 / Math.sqrt(D_MODEL);
  fillNormal(embed, rng, scale);
  fillNormal(wq, rng, scale);
  fillNormal(wk, rng, scale);
  fillNormal(wv, rng, scale);
  fillNormal(wo, rng, scale);
  fillNormal(w1, rng, scale);
  fillNormal(w2, rng, scale);
  cached = { embed, wq, wk, wv, wo, w1, w2 };
  return cached;
}

export function uniqueParamCount(): number {
  return (
    VOCAB_SIZE * D_MODEL +
    4 * D_MODEL * D_MODEL +
    D_MODEL * D_FF +
    D_FF * D_MODEL
  );
}

export function blockParamCount(): number {
  return 4 * D_MODEL * D_MODEL + D_MODEL * D_FF + D_FF * D_MODEL;
}

export function flopsPerBlock(seqLen: number): number {
  const qkv = 3 * 2 * seqLen * D_MODEL * D_MODEL;
  const scores = 2 * N_HEADS * seqLen * seqLen * D_HEAD;
  const av = 2 * N_HEADS * seqLen * seqLen * D_HEAD;
  const proj = 2 * seqLen * D_MODEL * D_MODEL;
  const ff = 2 * seqLen * D_MODEL * D_FF + 2 * seqLen * D_FF * D_MODEL;
  return qkv + scores + av + proj + ff;
}

export function flopsForLoops(seqLen: number, loops: number): number {
  return flopsPerBlock(seqLen) * loops;
}

export function applySharedBlock(
  hidden: Float64Array,
  seqLen: number,
  weights: SharedWeights,
): { hidden: Float64Array; attn: Float64Array } {
  const normed = rmsNorm(hidden, D_MODEL);
  const q = matmul(normed, seqLen, D_MODEL, weights.wq, D_MODEL);
  const k = matmul(normed, seqLen, D_MODEL, weights.wk, D_MODEL);
  const v = matmul(normed, seqLen, D_MODEL, weights.wv, D_MODEL);
  const attn = zeros(seqLen * seqLen);
  const ctx = zeros(seqLen * D_MODEL);
  const scale = 1 / Math.sqrt(D_HEAD);

  for (let h = 0; h < N_HEADS; h += 1) {
    const scores = zeros(seqLen * seqLen);
    for (let i = 0; i < seqLen; i += 1) {
      for (let j = 0; j < seqLen; j += 1) {
        let dot = 0;
        const qi = i * D_MODEL + h * D_HEAD;
        const kj = j * D_MODEL + h * D_HEAD;
        for (let d = 0; d < D_HEAD; d += 1) {
          dot += q[qi + d]! * k[kj + d]!;
        }
        scores[i * seqLen + j] = dot * scale;
      }
      softmaxRow(scores, i * seqLen, seqLen);
    }
    addInPlace(attn, scores);
    for (let i = 0; i < seqLen; i += 1) {
      for (let d = 0; d < D_HEAD; d += 1) {
        let acc = 0;
        for (let j = 0; j < seqLen; j += 1) {
          acc += scores[i * seqLen + j]! * v[j * D_MODEL + h * D_HEAD + d]!;
        }
        ctx[i * D_MODEL + h * D_HEAD + d] += acc;
      }
    }
  }

  for (let i = 0; i < attn.length; i += 1) {
    attn[i]! /= N_HEADS;
  }

  const projected = matmul(ctx, seqLen, D_MODEL, weights.wo, D_MODEL);
  const residual = hidden.slice();
  addInPlace(residual, projected);
  const ffNorm = rmsNorm(residual, D_MODEL);
  const h1 = relu(matmul(ffNorm, seqLen, D_MODEL, weights.w1, D_FF));
  const h2 = matmul(h1, seqLen, D_FF, weights.w2, D_MODEL);
  addInPlace(residual, h2);
  return { hidden: residual, attn };
}

export function runLoopedKernel(seqLen: number, loops: number): number {
  const weights = sharedWeights();
  const hidden = zeros(seqLen * D_MODEL);
  const rng = mulberry32(seqLen * 97 + loops);
  fillNormal(hidden, rng, 0.3);
  for (let i = 0; i < loops; i += 1) {
    const next = applySharedBlock(hidden, seqLen, weights);
    hidden.set(next.hidden);
  }
  return hidden[0] ?? 0;
}

export function measureKernelMs(seqLen: number, loops: number): number {
  runLoopedKernel(seqLen, loops);
  const start = performance.now();
  for (let i = 0; i < BENCH_REPEATS; i += 1) {
    runLoopedKernel(seqLen, loops);
  }
  return (performance.now() - start) / BENCH_REPEATS;
}

export function taskSeqLen(task: "addition" | "maze"): number {
  return task === "addition" ? ADD_SEQ_LEN : MAZE_SIZE * MAZE_SIZE;
}
