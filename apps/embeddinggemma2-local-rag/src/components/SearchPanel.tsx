import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  query: string
  onQuery: (value: string) => void
  onSearch: () => void
  onImageQuery: (file: File) => void
  busy: boolean
  codeMode: boolean
  onCodeMode: (value: boolean) => void
}

export function SearchPanel({
  query,
  onQuery,
  onSearch,
  onImageQuery,
  busy,
  codeMode,
  onCodeMode,
}: Props) {
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSearch()
      }}
    >
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Natural language query — e.g. cats sleeping on a couch"
          disabled={busy}
        />
        <Button type="submit" disabled={busy || query.trim().length === 0}>
          Search
        </Button>
        <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-2.5 text-sm">
          Query image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImageQuery(file)
              e.target.value = ""
            }}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={codeMode}
          onChange={(e) => onCodeMode(e.target.checked)}
        />
        Code-retrieval prefix (EmbeddingGemma 2 only)
      </label>
    </form>
  )
}
