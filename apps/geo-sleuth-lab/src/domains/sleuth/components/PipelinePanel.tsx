import { Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { formatHeading, formatLatLng } from "@/domains/sleuth/geo"
import type { SleuthPlan } from "@/domains/sleuth/types"
import type { RunPhase } from "@/domains/sleuth/use-sleuth-run"

type PipelinePanelProps = {
  plan: SleuthPlan
  phase: RunPhase
  revealed: number
  liveRequested: boolean
  togglePending: boolean
  onLiveRequested: (next: boolean) => void
  onRun: () => void
}

const GRADE_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No fix",
} as const

export function PipelinePanel({
  plan,
  phase,
  revealed,
  liveRequested,
  togglePending,
  onLiveRequested,
  onRun,
}: PipelinePanelProps) {
  const running = phase === "running"
  const estimateVisible = revealed >= plan.steps.length && plan.estimate
  const confidencePercent = plan.estimate ? Math.round(plan.estimate.confidence * 100) : 0

  return (
    <Card data-testid="pipeline" className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Sleuth</CardTitle>
            <p className="text-xs text-muted-foreground">{plan.plateLabel}</p>
          </div>
          <Button data-testid="run-sleuth" onClick={onRun} disabled={running}>
            <Play />
            {running ? "Running" : "Run sleuth"}
          </Button>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2">
          <div>
            <p className="text-xs font-medium">Live fetches</p>
            <p className="text-[11px] text-muted-foreground">Overpass, and MapTiler if a key exists</p>
          </div>
          <Switch
            data-testid="live-switch"
            checked={liveRequested}
            disabled={running}
            onCheckedChange={onLiveRequested}
            aria-label="Live fetches"
          />
        </div>
        <p data-testid="mode-note" className="text-xs leading-relaxed text-muted-foreground">
          {plan.modeNote}
          {togglePending ? " Toggle applies on the next run." : ""}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ol className="flex flex-col gap-2">
          {plan.steps.map((step, index) => {
            const done = index < revealed
            const active = running && index === revealed
            return (
              <li
                key={step.id}
                data-testid={`step-${step.id}`}
                data-state={done ? "done" : active ? "active" : "pending"}
                className={`rounded-lg border px-3 py-2 ${
                  done ? "border-orange-700/40 bg-orange-700/5" : "border-transparent bg-muted/40"
                } ${active ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    <span className="mr-2 font-mono text-[11px] text-muted-foreground">0{index + 1}</span>
                    {step.title}
                  </p>
                  <span className="font-mono text-[10px] text-muted-foreground">{step.script}</span>
                </div>
                {done ? (
                  <>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.summary}</p>
                    <p className="mt-1 font-mono text-[11px]">{step.metric}</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">{active ? "Working" : "Waiting"}</p>
                )}
              </li>
            )
          })}
        </ol>
        {estimateVisible && plan.estimate ? (
          <div data-testid="estimate-readout" className="rounded-lg border border-orange-700/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm">{formatLatLng(plan.estimate.camera)}</p>
              <Badge variant="outline">{GRADE_LABEL[plan.estimate.grade]}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {plan.estimate.placeLabel} · heading {formatHeading(plan.estimate.headingDeg)} · ±{plan.estimate.radiusM} m · looking toward {plan.estimate.landmarkName}
            </p>
            <Progress value={confidencePercent} className="mt-3">
              <ProgressLabel>Confidence</ProgressLabel>
              <ProgressValue>
                {(formatted) => (formatted == null ? "0%" : `${formatted}%`)}
              </ProgressValue>
            </Progress>
          </div>
        ) : null}
        {revealed >= plan.steps.length && !plan.estimate ? (
          <div data-testid="estimate-refused" className="rounded-lg border px-3 py-2 text-sm">
            No camera fix. Upload was not matched to a public-landmark plate.
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
