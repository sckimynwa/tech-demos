import { DisclaimerBanner } from "@/domains/sleuth/components/DisclaimerBanner"
import { EstimateMap } from "@/domains/sleuth/components/EstimateMap"
import { EvidenceBoard } from "@/domains/sleuth/components/EvidenceBoard"
import { PipelinePanel } from "@/domains/sleuth/components/PipelinePanel"
import { PlateStrip } from "@/domains/sleuth/components/PlateStrip"
import { useSleuthRun } from "@/domains/sleuth/use-sleuth-run"

const EVIDENCE_STEP_INDEX = 3

export default function App() {
  const sleuth = useSleuthRun()
  const showFix = sleuth.revealed >= sleuth.plan.steps.length
  const showEvidence = sleuth.revealed > EVIDENCE_STEP_INDEX

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">Public landmark lab</p>
            <h1 className="text-xl font-medium tracking-tight">Geo Sleuth Lab</h1>
          </div>
          <p className="hidden max-w-sm text-right text-xs text-muted-foreground sm:block">
            A browser replay of the geo-sleuth pipeline. Scripts rank. This page shows the work.
          </p>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
        <DisclaimerBanner />
        <PlateStrip
          selection={sleuth.selection}
          disabled={sleuth.phase === "running"}
          onSelectSample={sleuth.selectSample}
          onSelectUpload={sleuth.selectUpload}
        />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <EstimateMap estimate={sleuth.plan.estimate} showFix={showFix} />
          <PipelinePanel
            plan={sleuth.plan}
            phase={sleuth.phase}
            revealed={sleuth.revealed}
            liveRequested={sleuth.liveRequested}
            togglePending={sleuth.togglePending}
            onLiveRequested={sleuth.setLiveRequested}
            onRun={() => {
              void sleuth.run()
            }}
          />
        </div>
        <EvidenceBoard cards={sleuth.plan.evidence} visible={showEvidence} />
      </main>
    </div>
  )
}
