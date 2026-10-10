import { useEffect, useMemo, useRef, useState } from "react"
import { CorpusList } from "@/components/CorpusList"
import { DropZone } from "@/components/DropZone"
import { EmbeddingMap } from "@/components/EmbeddingMap"
import { ModelBanner } from "@/components/ModelBanner"
import { ResultsList } from "@/components/ResultsList"
import { SearchPanel } from "@/components/SearchPanel"
import { Button } from "@/components/ui/button"
import {
  collectDroppedFiles,
  embedCorpusItem,
  itemsFromFiles,
  loadSampleManifest,
  sampleItemsFromManifest,
} from "@/lib/corpus"
import { loadBestEmbedder } from "@/lib/embeddings"
import { projectTo2D } from "@/lib/pca"
import { rankByCosine } from "@/lib/similarity"
import type { CorpusItem, Embedder, LoadProgress, SearchHit } from "@/lib/types"

export default function App() {
  const [embedder, setEmbedder] = useState<Embedder | null>(null)
  const [loadingModel, setLoadingModel] = useState(true)
  const [progress, setProgress] = useState<LoadProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<CorpusItem[]>([])
  const [hits, setHits] = useState<SearchHit[]>([])
  const [query, setQuery] = useState("cats sleeping on a couch")
  const [queryLabel, setQueryLabel] = useState<string | null>(null)
  const [queryEmbedding, setQueryEmbedding] = useState<Float32Array | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [codeMode, setCodeMode] = useState(false)
  const [status, setStatus] = useState("")
  const bootGen = useRef(0)

  async function boot(forceFallback: boolean) {
    const gen = ++bootGen.current
    setLoadingModel(true)
    setError(null)
    setHits([])
    setQueryEmbedding(null)
    setQueryLabel(null)
    try {
      const next = await loadBestEmbedder(
        (p) => {
          if (bootGen.current === gen) setProgress(p)
        },
        { forceFallback },
      )
      if (bootGen.current !== gen) return
      setEmbedder(next)
      setLoadingModel(false)
      const manifest = await loadSampleManifest()
      const samples = await sampleItemsFromManifest(manifest)
      if (bootGen.current !== gen) return
      setItems(samples)
      await embedAll(samples, next, gen)
    } catch (err) {
      if (bootGen.current !== gen) return
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (bootGen.current === gen) {
        setLoadingModel(false)
        setBusy(false)
        setStatus("")
      }
    }
  }

  async function embedAll(source: CorpusItem[], model: Embedder, gen: number) {
    setBusy(true)
    const done: CorpusItem[] = []
    for (const item of source) {
      if (bootGen.current !== gen) return
      setStatus(`embedding ${item.title}`)
      const next = await embedCorpusItem(item, model)
      done.push(next)
      setItems([...done, ...source.slice(done.length)])
    }
    setItems(done)
    setBusy(false)
    setStatus("")
  }

  useEffect(() => {
    void boot(false)
    return () => {
      bootGen.current += 1
    }
  }, [])

  async function addFiles(files: File[]) {
    if (!embedder) return
    const incoming = await itemsFromFiles(files)
    if (incoming.length === 0) return
    setBusy(true)
    const merged = [...items]
    for (const item of incoming) {
      setStatus(`embedding ${item.title}`)
      const next = await embedCorpusItem(item, embedder)
      merged.push(next)
      setItems([...merged])
    }
    setBusy(false)
    setStatus("")
  }

  async function runTextSearch() {
    if (!embedder) return
    const q = query.trim()
    if (!q) return
    setBusy(true)
    setStatus("embedding query")
    try {
      const vec = await embedder.embedText(q, "query", { isCode: codeMode })
      applyQuery(vec, q)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setStatus("")
    }
  }

  async function runImageSearch(file: File) {
    if (!embedder) return
    setBusy(true)
    setStatus("embedding query image")
    try {
      const vec = await embedder.embedImage(file)
      applyQuery(vec, `image: ${file.name}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
      setStatus("")
    }
  }

  function applyQuery(vec: Float32Array, label: string) {
    setQueryEmbedding(vec)
    setQueryLabel(label)
    const scored = items.filter((item): item is CorpusItem & { embedding: Float32Array } =>
      Boolean(item.embedding),
    )
    const ranked = rankByCosine(
      vec,
      scored.map((item) => ({ id: item.id, embedding: item.embedding })),
    )
    const byId = new Map(items.map((item) => [item.id, item]))
    const nextHits: SearchHit[] = ranked.flatMap((row) => {
      const item = byId.get(row.id)
      return item ? [{ item, score: row.score }] : []
    })
    setHits(nextHits)
    setActiveId(nextHits[0]?.item.id ?? null)
  }

  const points = useMemo(() => {
    const embedded = items.filter((item): item is CorpusItem & { embedding: Float32Array } =>
      Boolean(item.embedding),
    )
    const rows: {
      id: string
      title: string
      embedding: Float32Array
      modality: CorpusItem["modality"] | "query"
    }[] = embedded.map((item) => ({
      id: item.id,
      title: item.title,
      embedding: item.embedding,
      modality: item.modality,
    }))
    if (queryEmbedding && queryLabel) {
      rows.push({
        id: "__query__",
        title: queryLabel,
        embedding: queryEmbedding,
        modality: "query",
      })
    }
    return projectTo2D(rows)
  }, [items, queryEmbedding, queryLabel])

  const embeddingCount = items.filter((item) => item.embedding).length
  const selected = items.find((item) => item.id === activeId) ?? null

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <ModelBanner
        embedder={embedder}
        loading={loadingModel}
        progress={progress}
        error={error}
        onForceFallback={() => void boot(true)}
        onRetryPrimary={() => void boot(false)}
      />

      <main className="grid min-h-0 flex-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <section className="flex min-h-0 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Corpus</h2>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={!embedder || busy}
              onClick={() => {
                void loadSampleManifest()
                  .then(sampleItemsFromManifest)
                  .then((samples) => {
                    if (!embedder) return
                    setHits([])
                    setQueryEmbedding(null)
                    return embedAll(samples, embedder, bootGen.current)
                  })
              }}
            >
              Reload samples
            </Button>
          </div>
          <DropZone
            disabled={!embedder || busy}
            collect={collectDroppedFiles}
            onFiles={(files) => void addFiles(files)}
          />
          <CorpusList
            items={items}
            activeId={activeId}
            embeddingCount={embeddingCount}
            onSelect={setActiveId}
          />
          {status ? (
            <p className="font-mono text-xs text-muted-foreground">{status}</p>
          ) : null}
        </section>

        <section className="flex min-h-0 flex-col gap-3">
          <SearchPanel
            query={query}
            onQuery={setQuery}
            onSearch={() => void runTextSearch()}
            onImageQuery={(file) => void runImageSearch(file)}
            busy={!embedder || busy || loadingModel}
            codeMode={codeMode}
            onCodeMode={setCodeMode}
          />
          <ResultsList
            hits={hits}
            activeId={activeId}
            onSelect={setActiveId}
            queryLabel={queryLabel}
          />
          {selected?.skippedReason ? (
            <p className="text-xs text-destructive">{selected.skippedReason}</p>
          ) : null}
        </section>

        <section className="min-h-0">
          <h2 className="mb-2 text-sm font-medium">Embedding map (PCA)</h2>
          <EmbeddingMap points={points} activeId={activeId} onSelect={setActiveId} />
        </section>
      </main>
    </div>
  )
}
