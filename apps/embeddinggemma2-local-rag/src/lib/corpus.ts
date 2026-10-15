import type { CorpusItem, Embedder, Modality } from "./types"

export type SampleManifestItem = {
  id: string
  title: string
  modality: Modality
  path: string
}

export type SampleManifest = {
  items: SampleManifestItem[]
}

const TEXT_EXT = new Set([
  "txt",
  "md",
  "markdown",
  "json",
  "csv",
  "html",
  "css",
])
const CODE_EXT = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "py",
  "rs",
  "go",
  "java",
  "c",
  "cc",
  "cpp",
  "h",
  "hpp",
  "rb",
  "php",
  "swift",
  "kt",
  "sql",
  "sh",
])
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif", "bmp"])
const AUDIO_EXT = new Set(["wav", "mp3", "m4a", "ogg", "flac", "webm"])

function extOf(name: string): string {
  const i = name.lastIndexOf(".")
  return i >= 0 ? name.slice(i + 1).toLowerCase() : ""
}

export function modalityOfFile(file: File): Modality | null {
  const ext = extOf(file.name)
  if (file.type.startsWith("image/") || IMAGE_EXT.has(ext)) return "image"
  if (file.type.startsWith("audio/") || AUDIO_EXT.has(ext)) return "audio"
  if (CODE_EXT.has(ext)) return "code"
  if (file.type.startsWith("text/") || TEXT_EXT.has(ext)) return "text"
  if (TEXT_EXT.has(ext) || CODE_EXT.has(ext)) return "text"
  return null
}

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

export async function loadSampleManifest(): Promise<SampleManifest> {
  const res = await fetch("/samples/manifest.json")
  if (!res.ok) throw new Error("Missing /samples/manifest.json")
  return (await res.json()) as SampleManifest
}

export async function sampleItemsFromManifest(
  manifest: SampleManifest,
): Promise<CorpusItem[]> {
  const items: CorpusItem[] = []
  for (const row of manifest.items) {
    const url = row.path
    let text: string | undefined
    if (row.modality === "text" || row.modality === "code") {
      const res = await fetch(url)
      text = await res.text()
    }
    items.push({
      id: row.id,
      title: row.title,
      modality: row.modality,
      source: "sample",
      text,
      url,
    })
  }
  return items
}

export async function itemsFromFiles(files: File[]): Promise<CorpusItem[]> {
  const items: CorpusItem[] = []
  for (const file of files) {
    const modality = modalityOfFile(file)
    if (!modality) continue
    const url = URL.createObjectURL(file)
    let text: string | undefined
    if (modality === "text" || modality === "code") {
      text = await file.text()
    }
    items.push({
      id: newId(modality),
      title: file.name,
      modality,
      source: "user",
      text,
      url,
    })
  }
  return items
}

export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const files: File[] = []
  const items = dataTransfer.items
  if (items && items.length > 0) {
    const pending: Promise<void>[] = []
    for (const item of items) {
      const entry = item.webkitGetAsEntry?.()
      if (entry) {
        pending.push(walkEntry(entry, files))
      } else {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    await Promise.all(pending)
    if (files.length > 0) return files
  }
  return Array.from(dataTransfer.files)
}

async function walkEntry(entry: FileSystemEntry, out: File[]): Promise<void> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => {
      ;(entry as FileSystemFileEntry).file(resolve, reject)
    })
    out.push(file)
    return
  }
  if (entry.isDirectory) {
    const dir = entry as FileSystemDirectoryEntry
    const reader = dir.createReader()
    const children: FileSystemEntry[] = []
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject)
      })
      if (batch.length === 0) break
      children.push(...batch)
    }
    for (const child of children) {
      await walkEntry(child, out)
    }
  }
}

export async function embedCorpusItem(
  item: CorpusItem,
  embedder: Embedder,
): Promise<CorpusItem> {
  const supported = embedder.modalities.includes(item.modality)
  if (!supported) {
    return {
      ...item,
      embedding: undefined,
      skippedReason:
        item.modality === "audio" && embedder.isFallback
          ? "Audio is excluded in CLIP fallback (different embedding space). Not scored."
          : `${item.modality} not supported by ${embedder.label}`,
    }
  }

  if (item.modality === "image") {
    return { ...item, embedding: await embedder.embedImage(item.url), skippedReason: undefined }
  }
  if (item.modality === "audio") {
    return { ...item, embedding: await embedder.embedAudio(item.url), skippedReason: undefined }
  }
  const body = item.text ?? ""
  return {
    ...item,
    embedding: await embedder.embedText(body, "document", {
      title: item.title,
      isCode: item.modality === "code",
    }),
    skippedReason: undefined,
  }
}
