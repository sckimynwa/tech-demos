import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Embedder, LoadProgress } from "@/lib/types"

type Props = {
  embedder: Embedder | null
  loading: boolean
  progress: LoadProgress | null
  error: string | null
  onForceFallback: () => void
  onRetryPrimary: () => void
}

export function ModelBanner({
  embedder,
  loading,
  progress,
  error,
  onForceFallback,
  onRetryPrimary,
}: Props) {
  const isFallback = embedder?.isFallback ?? false

  return (
    <header className="border-b border-border bg-card/60 px-5 py-4 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-lg font-medium tracking-tight">
              EmbeddingGemma 2 local search
            </h1>
            {embedder ? (
              <Badge variant={isFallback ? "destructive" : "default"}>
                {isFallback ? "FALLBACK" : "REAL"}
              </Badge>
            ) : (
              <Badge variant="secondary">loading</Badge>
            )}
            {embedder ? (
              <Badge variant="outline">
                {embedder.label} · {embedder.device}
              </Badge>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {embedder
              ? embedder.note
              : "On-device multimodal embeddings. No API keys. First-run weights download from Hugging Face."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <Button type="button" variant="outline" size="sm" onClick={onForceFallback}>
              Use CLIP fallback
            </Button>
          ) : null}
          {embedder?.isFallback ? (
            <Button type="button" variant="outline" size="sm" onClick={onRetryPrimary}>
              Retry EmbeddingGemma 2
            </Button>
          ) : null}
        </div>
      </div>
      {loading ? (
        <div className="mt-3 space-y-1.5">
          <Progress value={Math.min(100, progress?.progress ?? 8)} />
          <p className="font-mono text-xs text-muted-foreground">
            {progress?.phase ?? "starting"}
            {progress?.file ? ` · ${progress.file}` : ""}
            {progress?.progress ? ` · ${progress.progress.toFixed(0)}%` : ""}
          </p>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </header>
  )
}
