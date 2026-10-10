import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { SearchHit } from "@/lib/types"

type Props = {
  hits: SearchHit[]
  activeId: string | null
  onSelect: (id: string) => void
  queryLabel: string | null
}

function preview(hit: SearchHit) {
  if (hit.item.modality === "image") {
    return (
      <img
        src={hit.item.url}
        alt={hit.item.title}
        className="size-12 shrink-0 rounded-md object-cover"
      />
    )
  }
  if (hit.item.modality === "audio") {
    return <audio src={hit.item.url} controls className="h-8 w-36" />
  }
  return (
    <p className="line-clamp-2 text-xs text-muted-foreground">
      {hit.item.text?.slice(0, 160) ?? ""}
    </p>
  )
}

export function ResultsList({ hits, activeId, onSelect, queryLabel }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="text-xs text-muted-foreground">
        {queryLabel ? `Query: ${queryLabel}` : "No query yet"} · cosine of the
        active embedder (not fake)
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ol className="space-y-2 pr-2">
          {hits.map((hit, i) => (
            <li key={hit.item.id}>
              <Card
                size="sm"
                className={activeId === hit.item.id ? "ring-2 ring-ring" : ""}
              >
                <CardContent>
                  <button
                    type="button"
                    className="flex w-full items-start gap-3 text-left"
                    onClick={() => onSelect(hit.item.id)}
                  >
                    <span className="w-5 font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    {hit.item.modality === "image" ? preview(hit) : null}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{hit.item.title}</span>
                        <Badge variant="outline">{hit.item.modality}</Badge>
                        <span className="font-mono text-xs">
                          {hit.score.toFixed(3)}
                        </span>
                      </div>
                      {hit.item.modality !== "image" ? preview(hit) : null}
                    </div>
                  </button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </ScrollArea>
    </div>
  )
}
