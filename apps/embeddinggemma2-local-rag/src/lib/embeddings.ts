import type {
  DeviceKind,
  Embedder,
  EmbedTextOptions,
  LoadProgress,
  Modality,
  TextRole,
} from "./types"
import { canUseWebGPU, tensorToVector } from "./tensor"

export const EG2_MODEL_ID = "onnx-community/embeddinggemma-2-ONNX"
export const CLIP_MODEL_ID = "Xenova/clip-vit-base-patch32"

const AUDIO_SAMPLE_RATE = 16000
const EG2_DTYPE = "q4"

export function wantsForcedFallback(): boolean {
  if (typeof window === "undefined") return false
  const params = new URLSearchParams(window.location.search)
  return params.get("fallback") === "1" || params.get("fallback") === "clip"
}

function formatQuery(text: string, isCode: boolean): string {
  if (isCode) return `task: code retrieval | query: ${text}`
  return `task: search result | query: ${text}`
}

function formatDocument(text: string, title: string): string {
  return `title: ${title || "none"} | text: ${text}`
}

function onProgress(
  cb: ((p: LoadProgress) => void) | undefined,
  info: Record<string, unknown>,
) {
  if (!cb) return
  const status = String(info.status ?? info.phase ?? "loading")
  const file = typeof info.file === "string" ? info.file : undefined
  const loaded = typeof info.loaded === "number" ? info.loaded : undefined
  const total = typeof info.total === "number" ? info.total : undefined
  const progress =
    typeof info.progress === "number"
      ? info.progress
      : loaded && total
        ? (loaded / total) * 100
        : 0
  cb({ phase: status, file, progress, loaded, total })
}

async function blobUrl(source: string | Blob): Promise<string> {
  if (typeof source === "string") return source
  return URL.createObjectURL(source)
}

export async function loadEmbeddingGemma2(
  device: DeviceKind,
  onLoad?: (p: LoadProgress) => void,
  modalities: Array<"vision" | "audio"> = ["vision", "audio"],
): Promise<Embedder> {
  const transformers = await import("@huggingface/transformers")
  const { AutoModel, AutoProcessor, AutoConfig, load_image, load_audio } = transformers

  onLoad?.({ phase: `loading EmbeddingGemma 2 (${device}, q4)`, progress: 0 })

  const config = await AutoConfig.from_pretrained(EG2_MODEL_ID, {
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })
  if (!modalities.includes("vision")) {
    ;(config as { vision_config?: unknown }).vision_config = null
  }
  if (!modalities.includes("audio")) {
    ;(config as { audio_config?: unknown }).audio_config = null
  }

  const processor = await AutoProcessor.from_pretrained(EG2_MODEL_ID, {
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })
  const model = await AutoModel.from_pretrained(EG2_MODEL_ID, {
    config,
    device,
    dtype: EG2_DTYPE,
    session_options: device === "wasm" ? { executionProviders: ["wasm"] } : undefined,
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })

  const embed = async (...inputs: unknown[]) => {
    const processed = await (
      processor as unknown as (...args: unknown[]) => Promise<unknown>
    )(...inputs)
    const out = (await (
      model as unknown as (x: unknown) => Promise<{ sentence_embedding: { data: ArrayLike<number>; dims: number[] } }>
    )(processed)).sentence_embedding
    return tensorToVector(out)
  }

  const supported: Modality[] = ["text", "code"]
  if (modalities.includes("vision")) supported.push("image")
  if (modalities.includes("audio")) supported.push("audio")

  return {
    id: `embeddinggemma-2-${device}-${modalities.join("+") || "text"}`,
    label: "EmbeddingGemma 2",
    kind: "embeddinggemma-2",
    device,
    modalities: supported,
    isFallback: false,
    downloadHint: "q4 ONNX ~473MB first run (text 175 + vision 109 + audio 189)",
    note: "Real google/embeddinggemma-2 via onnx-community/embeddinggemma-2-ONNX. Shared 768-d space for text, code, image, audio.",
    async embedText(text, role: TextRole, opts?: EmbedTextOptions) {
      const payload =
        role === "query"
          ? formatQuery(text, Boolean(opts?.isCode))
          : formatDocument(text, opts?.title ?? "none")
      return embed([payload])
    },
    async embedImage(source) {
      const image = await load_image(source)
      return embed(null, image)
    },
    async embedAudio(source) {
      const url = await blobUrl(source)
      const audio = await load_audio(url, AUDIO_SAMPLE_RATE)
      if (typeof source !== "string") URL.revokeObjectURL(url)
      return embed(null, null, audio)
    },
  }
}

export async function loadClipFallback(
  device: DeviceKind,
  onLoad?: (p: LoadProgress) => void,
): Promise<Embedder> {
  const transformers = await import("@huggingface/transformers")
  const {
    AutoTokenizer,
    AutoProcessor,
    CLIPTextModelWithProjection,
    CLIPVisionModelWithProjection,
    load_image,
  } = transformers

  onLoad?.({ phase: `loading CLIP fallback (${device})`, progress: 0 })

  const tokenizer = await AutoTokenizer.from_pretrained(CLIP_MODEL_ID, {
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })
  const session_options = device === "wasm" ? { executionProviders: ["wasm"] } : undefined
  const textModel = await CLIPTextModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
    device,
    dtype: "q8",
    session_options,
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })
  const processor = await AutoProcessor.from_pretrained(CLIP_MODEL_ID, {
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })
  const visionModel = await CLIPVisionModelWithProjection.from_pretrained(CLIP_MODEL_ID, {
    device,
    dtype: "q8",
    session_options,
    progress_callback: (info: Record<string, unknown>) => onProgress(onLoad, info),
  })

  return {
    id: `clip-${device}`,
    label: "CLIP ViT-B/32 (fallback)",
    kind: "fallback-clip",
    device,
    modalities: ["text", "code", "image"],
    isFallback: true,
    downloadHint: "Xenova/clip-vit-base-patch32 q8 — text+image only",
    note: "Fallback: CLIP text and image encoders share one space. Audio is excluded from ranking (not the same space). Scores are still real cosine.",
    async embedText(text) {
      const inputs = tokenizer([text], { padding: true, truncation: true })
      const { text_embeds } = await (
        textModel as unknown as (x: unknown) => Promise<{
          text_embeds: { data: ArrayLike<number>; dims: number[] }
        }>
      )(inputs)
      return tensorToVector(text_embeds)
    },
    async embedImage(source) {
      const image = await load_image(source)
      const inputs = await (
        processor as unknown as (img: unknown) => Promise<unknown>
      )(image)
      const { image_embeds } = await (
        visionModel as unknown as (x: unknown) => Promise<{
          image_embeds: { data: ArrayLike<number>; dims: number[] }
        }>
      )(inputs)
      return tensorToVector(image_embeds)
    },
    async embedAudio() {
      throw new Error("Audio is not in the CLIP fallback embedding space")
    },
  }
}

export async function loadBestEmbedder(
  onLoad?: (p: LoadProgress) => void,
  options?: { forceFallback?: boolean; forcePrimary?: boolean },
): Promise<Embedder> {
  const force =
    options?.forcePrimary === true
      ? false
      : Boolean(options?.forceFallback) || wantsForcedFallback()
  const gpu = await canUseWebGPU()
  const primaryDevice: DeviceKind = gpu ? "webgpu" : "wasm"
  const fallbackDevice: DeviceKind = gpu ? "webgpu" : "wasm"

  if (!force) {
    const attempts: Array<{
      device: DeviceKind
      modalities: Array<"vision" | "audio">
    }> = [
      { device: primaryDevice, modalities: ["vision", "audio"] },
    ]
    if (primaryDevice === "webgpu") {
      attempts.push({ device: "wasm", modalities: ["vision", "audio"] })
      attempts.push({ device: "wasm", modalities: ["vision"] })
    } else {
      attempts.push({ device: "wasm", modalities: ["vision"] })
    }

    let lastError: unknown
    for (const attempt of attempts) {
      try {
        onLoad?.({
          phase: `trying EmbeddingGemma 2 (${attempt.device}, ${attempt.modalities.join("+")})`,
          progress: 0,
        })
        return await loadEmbeddingGemma2(attempt.device, onLoad, attempt.modalities)
      } catch (err) {
        lastError = err
        console.warn("EmbeddingGemma 2 load failed", attempt, err)
      }
    }
    onLoad?.({
      phase: `EmbeddingGemma 2 failed (${String(lastError)}). Switching to CLIP fallback.`,
      progress: 0,
    })
  } else {
    onLoad?.({ phase: "forced CLIP fallback", progress: 0 })
  }

  try {
    return await loadClipFallback(fallbackDevice, onLoad)
  } catch (err) {
    if (fallbackDevice === "webgpu") {
      return loadClipFallback("wasm", onLoad)
    }
    throw err
  }
}
