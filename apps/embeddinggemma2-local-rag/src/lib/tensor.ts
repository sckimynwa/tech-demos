import { l2Normalize } from "./similarity"

type TensorLike = {
  data: ArrayLike<number>
  dims?: number[]
}

export function tensorToVector(tensor: TensorLike): Float32Array {
  const dim = tensor.dims?.[tensor.dims.length - 1] ?? tensor.data.length
  const out = new Float32Array(dim)
  for (let i = 0; i < dim; i++) {
    out[i] = Number(tensor.data[i] ?? 0)
  }
  return l2Normalize(out)
}

export function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.gpu)
}
