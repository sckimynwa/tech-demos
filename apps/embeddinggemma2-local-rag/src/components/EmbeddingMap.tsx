import type { Point2D } from "@/lib/types"

const COLORS: Record<string, string> = {
  text: "#d4d4d8",
  code: "#34d399",
  image: "#38bdf8",
  audio: "#fbbf24",
  query: "#fafafa",
}

type Props = {
  points: Point2D[]
  activeId: string | null
  onSelect: (id: string) => void
}

export function EmbeddingMap({ points, activeId, onSelect }: Props) {
  return (
    <div className="flex h-full min-h-64 flex-col gap-2">
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        {Object.entries(COLORS).map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-1">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: color }}
            />
            {name}
          </span>
        ))}
      </div>
      <svg
        viewBox="0 0 100 100"
        className="h-full min-h-64 w-full rounded-xl bg-card ring-1 ring-foreground/10"
        role="img"
        aria-label="2D PCA of embeddings"
      >
        {points.map((p) => {
          const isQuery = p.modality === "query"
          const active = p.id === activeId
          const fill = COLORS[p.modality] ?? "#fff"
          return (
            <g
              key={p.id}
              transform={`translate(${p.x * 100} ${p.y * 100})`}
              className="cursor-pointer"
              onClick={() => onSelect(p.id)}
            >
              {isQuery ? (
                <polygon
                  points="0,-3.2 2.4,0 0,3.2 -2.4,0"
                  fill={fill}
                  stroke={active ? "#fff" : "transparent"}
                  strokeWidth={0.6}
                />
              ) : (
                <circle
                  r={active ? 2.4 : 1.7}
                  fill={fill}
                  stroke={active ? "#fff" : "transparent"}
                  strokeWidth={0.5}
                />
              )}
              <title>{p.title}</title>
            </g>
          )
        })}
      </svg>
      <p className="text-[11px] text-muted-foreground">
        2D PCA of the live embeddings. Nearby points are similar in the active
        model&apos;s space.
      </p>
    </div>
  )
}
