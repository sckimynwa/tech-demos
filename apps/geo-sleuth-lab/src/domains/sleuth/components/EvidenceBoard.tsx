import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { EvidenceCardModel, EvidenceKind, SchematicId } from "@/domains/sleuth/types"

type EvidenceBoardProps = {
  cards: EvidenceCardModel[]
  visible: boolean
}

const SOURCE_LABEL = {
  mock: "Mock",
  overpass: "Overpass",
  maptiler: "MapTiler",
} as const

export function EvidenceBoard({ cards, visible }: EvidenceBoardProps) {
  return (
    <section data-testid="evidence-board" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.kind} size="sm" data-testid={`evidence-${card.kind}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{card.title}</CardTitle>
              <Badge variant="outline">{visible ? SOURCE_LABEL[card.source] : "Pending"}</Badge>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">{card.script}</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {visible ? <EvidenceFigure card={card} /> : <div className="h-24 rounded-md bg-muted" />}
            {visible ? (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">{card.body}</p>
                <p className="font-mono text-[11px]">{card.metric}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Waiting for the evidence step.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function EvidenceFigure({ card }: { card: EvidenceCardModel }) {
  if (card.kind === "skyline" && card.skyline) {
    return <SkylineChart photo={card.skyline.photo} rendered={card.skyline.rendered} />
  }
  if (card.kind === "satellite" && card.imageUrl) {
    return (
      <img
        src={card.imageUrl}
        alt="MapTiler satellite static at the canned camera fix"
        className="h-24 w-full rounded-md object-cover"
      />
    )
  }
  return <Schematic kind={card.kind} schematic={card.schematic} />
}

function SkylineChart({ photo, rendered }: { photo: number[]; rendered: number[] }) {
  const width = 280
  const height = 96
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full rounded-md bg-muted" role="img" aria-label="Photo ridge and rendered ridge">
      <path d={ridgePath(rendered, width, height)} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" strokeDasharray="4 3" />
      <path d={ridgePath(photo, width, height)} fill="none" stroke="#c2410c" strokeWidth="2" />
    </svg>
  )
}

function ridgePath(values: number[], width: number, height: number): string {
  if (values.length === 0) return ""
  const topPad = 8
  const usable = height - topPad * 2
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width
      const y = topPad + value * usable
      const command = index === 0 ? "M" : "L"
      return `${command}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

function Schematic({ kind, schematic }: { kind: EvidenceKind; schematic: SchematicId }) {
  if (schematic === "none") {
    return <div className="flex h-24 items-center justify-center rounded-md bg-muted text-[11px] text-muted-foreground">No schematic</div>
  }
  if (kind === "satellite") return <Nadir schematic={schematic} />
  if (kind === "street") return <Facade schematic={schematic} />
  return <OsmSketch schematic={schematic} />
}

function Nadir({ schematic }: { schematic: Exclude<SchematicId, "none"> }) {
  if (schematic === "eiffel") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#d7d2c6]" aria-hidden="true">
        <rect x="76" y="8" width="8" height="80" fill="#c4b7a2" />
        <rect x="70" y="18" width="20" height="16" fill="#5c5346" />
        <circle cx="80" cy="78" r="4" fill="#c2410c" />
      </svg>
    )
  }
  if (schematic === "gate") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#8aa4b5]" aria-hidden="true">
        <rect x="70" y="0" width="18" height="96" fill="#e0703a" />
        <circle cx="79" cy="16" r="4" fill="#c2410c" />
      </svg>
    )
  }
  if (schematic === "colosseum") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#cbb89a]" aria-hidden="true">
        <ellipse cx="78" cy="48" rx="28" ry="20" fill="none" stroke="#6b5438" strokeWidth="8" />
        <circle cx="108" cy="70" r="4" fill="#c2410c" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#7f9eae]" aria-hidden="true">
      <path d="M40 30 C55 10 70 18 80 34 C92 12 110 16 124 36 L110 58 L48 54 Z" fill="#f4f1ea" />
      <circle cx="36" cy="62" r="4" fill="#c2410c" />
    </svg>
  )
}

function Facade({ schematic }: { schematic: Exclude<SchematicId, "none"> }) {
  if (schematic === "eiffel") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#d5e3f0]" aria-hidden="true">
        <polygon points="80,8 48,88 112,88" fill="none" stroke="#5c5346" strokeWidth="3" />
        <line x1="58" y1="58" x2="102" y2="58" stroke="#5c5346" />
      </svg>
    )
  }
  if (schematic === "gate") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#c5d5e0]" aria-hidden="true">
        <path d="M10 40 Q80 70 150 36" fill="none" stroke="#e0703a" strokeWidth="3" />
        <rect x="48" y="28" width="6" height="40" fill="#e0703a" />
        <rect x="106" y="24" width="6" height="44" fill="#e0703a" />
      </svg>
    )
  }
  if (schematic === "colosseum") {
    return (
      <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#eadcc4]" aria-hidden="true">
        {Array.from({ length: 7 }, (_, index) => (
          <rect key={index} x={18 + index * 18} y={28} width="10" height="16" rx="5" fill="#6b5438" />
        ))}
        <rect x="14" y="52" width="132" height="22" fill="#a89070" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-[#9eb6c4]" aria-hidden="true">
      <path d="M20 70 C40 30 55 28 70 62 C82 24 100 20 118 58 C128 36 140 40 148 68 Z" fill="#f7f4ee" />
    </svg>
  )
}

function OsmSketch({ schematic }: { schematic: Exclude<SchematicId, "none"> }) {
  return (
    <svg viewBox="0 0 160 96" className="h-24 w-full rounded-md bg-muted" aria-hidden="true">
      <path d="M8 70 C40 40 70 80 150 30" fill="none" stroke="currentColor" className="text-muted-foreground" />
      <circle cx="28" cy="62" r="3" fill="currentColor" className="text-muted-foreground" />
      <circle cx="78" cy="58" r="3" fill="currentColor" className="text-muted-foreground" />
      <circle cx="120" cy="40" r="4" fill="#c2410c" />
      <text x="8" y="16" fontSize="9" fill="currentColor" className="fill-muted-foreground">
        {schematic}
      </text>
    </svg>
  )
}
