import { useEffect, useMemo, useRef, useState } from "react"
import { buildPlan, overpassFailureNote, applyOverpass } from "@/domains/sleuth/engine"
import { readLiveConfig } from "@/domains/sleuth/live-config"
import { fetchOverpass } from "@/domains/sleuth/overpass"
import type { SampleId, SleuthPlan } from "@/domains/sleuth/types"

export const STEP_REVEAL_MS = 680

export type RunPhase = "idle" | "running" | "done"

export type Selection =
  | { kind: "sample"; sampleId: SampleId }
  | { kind: "upload"; fileName: string; previewUrl: string }

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function useSleuthRun() {
  const liveConfig = useMemo(() => readLiveConfig(), [])
  const [selection, setSelection] = useState<Selection>({ kind: "sample", sampleId: "eiffel" })
  const [liveRequested, setLiveRequested] = useState(false)
  const [phase, setPhase] = useState<RunPhase>("idle")
  const [revealed, setRevealed] = useState(0)
  const [plan, setPlan] = useState<SleuthPlan | null>(null)
  const selectionRef = useRef(selection)
  const runId = useRef(0)

  useEffect(() => {
    selectionRef.current = selection
  }, [selection])

  useEffect(() => {
    return () => {
      const current = selectionRef.current
      if (current.kind === "upload") URL.revokeObjectURL(current.previewUrl)
    }
  }, [])

  const preview = useMemo(
    () =>
      buildPlan(
        selection.kind === "sample"
          ? {
              kind: "sample",
              sampleId: selection.sampleId,
              liveRequested,
              config: liveConfig,
            }
          : {
              kind: "upload",
              fileName: selection.fileName,
              liveRequested,
              config: liveConfig,
            },
      ),
    [selection, liveRequested, liveConfig],
  )

  function resetRun() {
    runId.current += 1
    setPhase("idle")
    setRevealed(0)
    setPlan(null)
  }

  function replaceSelection(next: Selection) {
    const previous = selectionRef.current
    if (previous.kind === "upload" && previous.previewUrl !== (next.kind === "upload" ? next.previewUrl : "")) {
      URL.revokeObjectURL(previous.previewUrl)
    }
    setSelection(next)
    resetRun()
  }

  function selectSample(sampleId: SampleId) {
    replaceSelection({ kind: "sample", sampleId })
  }

  function selectUpload(file: File) {
    replaceSelection({
      kind: "upload",
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
    })
  }

  async function run() {
    const id = runId.current + 1
    runId.current = id
    const nextPlan = buildPlan(
      selection.kind === "sample"
        ? {
            kind: "sample",
            sampleId: selection.sampleId,
            liveRequested,
            config: liveConfig,
          }
        : {
            kind: "upload",
            fileName: selection.fileName,
            liveRequested,
            config: liveConfig,
          },
    )
    setPlan(nextPlan)
    setRevealed(0)
    setPhase("running")

    let current = nextPlan
    for (let index = 0; index < current.steps.length; index += 1) {
      await wait(STEP_REVEAL_MS)
      if (runId.current !== id) return
      const step = current.steps[index]
      if (step?.id === "osm" && current.mode === "live" && current.estimate) {
        try {
          const elements = await fetchOverpass(current.estimate.camera, fetch)
          if (runId.current !== id) return
          current = applyOverpass(current, elements)
        } catch (error) {
          const reason = error instanceof Error ? error.message : "request failed"
          current = overpassFailureNote(current, reason)
        }
        if (runId.current !== id) return
        setPlan(current)
      }
      setRevealed(index + 1)
    }
    if (runId.current !== id) return
    setPhase("done")
  }

  const activePlan = plan ?? preview
  const togglePending = plan != null && plan.liveRequested !== liveRequested

  return {
    selection,
    liveRequested,
    setLiveRequested,
    liveConfig,
    phase,
    revealed,
    plan: activePlan,
    togglePending,
    selectSample,
    selectUpload,
    run,
  }
}
