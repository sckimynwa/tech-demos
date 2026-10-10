import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CorpusItem, Modality } from "@/lib/types"

const MODALITY_LABEL: Record<Modality, string> = {
  text: "text",
  code: "code",
  image: "image",
  audio: "audio",
}

type Props = {
  items: CorpusItem[]
  activeId: string | null
  embeddingCount: number
  onSelect: (id: string) => void
}

export function CorpusList({ items, activeId, embeddingCount, onSelect }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {items.length} items · {embeddingCount} embedded
        </span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ul className="space-y-1 pr-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted ${
                  activeId === item.id ? "bg-muted" : ""
                }`}
              >
                <Badge variant="outline">{MODALITY_LABEL[item.modality]}</Badge>
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                {item.skippedReason ? (
                  <span className="text-[10px] text-destructive">skip</span>
                ) : item.embedding ? (
                  <span className="text-[10px] text-muted-foreground">ok</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">…</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
