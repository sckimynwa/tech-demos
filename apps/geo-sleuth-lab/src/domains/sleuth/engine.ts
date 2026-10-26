import { bearingDeg } from "@/domains/sleuth/geo"
import { maptilerStaticUrl, summarizeOverpass, type OverpassElement } from "@/domains/sleuth/overpass"
import { findSample } from "@/domains/sleuth/samples"
import type {
  ConfidenceGrade,
  EvidenceCardModel,
  Estimate,
  LiveConfig,
  PipelineStep,
  RunMode,
  SamplePlate,
  SleuthPlan,
} from "@/domains/sleuth/types"

export const HIGH_CONFIDENCE_MIN = 0.8
export const MEDIUM_CONFIDENCE_MIN = 0.55

const UPLOAD_PLATE_LABEL = "Uploaded image"

export function gradeConfidence(confidence: number | null): ConfidenceGrade {
  if (confidence == null || Number.isNaN(confidence)) return "none"
  if (confidence >= HIGH_CONFIDENCE_MIN) return "high"
  if (confidence >= MEDIUM_CONFIDENCE_MIN) return "medium"
  return "low"
}

export function resolveRunMode(
  liveRequested: boolean,
  config: LiveConfig,
): { mode: RunMode; modeNote: string } {
  if (!liveRequested) {
    return {
      mode: "offline-mock",
      modeNote: "Offline replay. Canned public-landmark results. No network calls.",
    }
  }
  if (!config.liveGeoEnabled) {
    return {
      mode: "live-unavailable",
      modeNote:
        "Live mode requested, but VITE_LIVE_GEO is not set. Staying on the offline replay. A MapTiler satellite image also needs VITE_MAPTILER_KEY.",
    }
  }
  const satelliteNote = config.maptilerKey
    ? "VITE_MAPTILER_KEY is set, so the satellite card requests a static image."
    : "No VITE_MAPTILER_KEY, so the satellite card stays a labeled schematic."
  return {
    mode: "live",
    modeNote: `Live Overpass enrichment is on. ${satelliteNote}`,
  }
}

function estimateFor(plate: SamplePlate): Estimate {
  const headingDeg = bearingDeg(plate.camera, plate.landmark)
  return {
    camera: plate.camera,
    landmark: plate.landmark,
    landmarkName: plate.landmarkName,
    headingDeg,
    radiusM: plate.radiusM,
    confidence: plate.confidence,
    grade: gradeConfidence(plate.confidence),
    placeLabel: plate.place,
  }
}

function stepsFor(plate: SamplePlate): PipelineStep[] {
  return [
    {
      id: "cues",
      title: "Image cues",
      script: "intake.py",
      summary: plate.cues.summary,
      metric: plate.cues.metric,
    },
    {
      id: "osm",
      title: "OSM / terrain hypothesis",
      script: "osm.py",
      summary: plate.osm.summary,
      metric: plate.osm.metric,
    },
    {
      id: "skyline",
      title: "Elevation / skyline check",
      script: "terrain.py fit",
      summary: plate.skyline.summary,
      metric: plate.skyline.metric,
    },
    {
      id: "evidence",
      title: "Satellite / street-view evidence",
      script: "tiles.py · gsv.py",
      summary: `${plate.satellite.summary} ${plate.street.summary}`,
      metric: plate.satellite.metric,
    },
    {
      id: "estimate",
      title: "Camera fix",
      script: "evidence.py",
      summary: `Canned public viewpoint for ${plate.landmarkName}. Heading is the bearing from the camera to the landmark. Radius is the leftover ambiguity after the skyline check.`,
      metric: `±${plate.radiusM} m · ${Math.round(plate.confidence * 100)}%`,
    },
  ]
}

function evidenceFor(plate: SamplePlate, mode: RunMode, maptilerKey: string | null): EvidenceCardModel[] {
  const satelliteLive = mode === "live" && maptilerKey
  return [
    {
      kind: "osm",
      title: "OSM geometry",
      script: "osm.py near",
      body: plate.osm.summary,
      metric: plate.osm.metric,
      source: "mock",
      schematic: plate.id,
    },
    {
      kind: "skyline",
      title: "Skyline fit",
      script: "terrain.py fit",
      body: plate.skyline.summary,
      metric: plate.skyline.metric,
      source: "mock",
      schematic: plate.id,
      skyline: { photo: plate.skyline.photo, rendered: plate.skyline.rendered },
    },
    {
      kind: "satellite",
      title: "Satellite",
      script: "tiles.py",
      body: satelliteLive
        ? "MapTiler satellite static at the canned camera fix. This is a live tile, not a vision match."
        : plate.satellite.summary,
      metric: satelliteLive ? "maptiler static · z16" : plate.satellite.metric,
      source: satelliteLive ? "maptiler" : "mock",
      imageUrl: satelliteLive ? maptilerStaticUrl(plate.camera, maptilerKey) : undefined,
      schematic: plate.id,
    },
    {
      kind: "street",
      title: "Street-view style",
      script: "gsv.py",
      body: plate.street.summary,
      metric: plate.street.metric,
      source: "mock",
      schematic: plate.id,
    },
  ]
}

const UPLOAD_STEPS: PipelineStep[] = [
  {
    id: "cues",
    title: "Image cues",
    script: "intake.py",
    summary:
      "File accepted as an image. EXIF GPS is not read. The offline pack has no template for this plate, and this demo has no vision model.",
    metric: "GPS ignored · 0 template hits",
  },
  {
    id: "osm",
    title: "OSM / terrain hypothesis",
    script: "osm.py",
    summary: "No anchor class survived the cue step, so no place hypothesis is launched and Overpass is not aimed at a guessed coordinate.",
    metric: "no query",
  },
  {
    id: "skyline",
    title: "Elevation / skyline check",
    script: "terrain.py ridge",
    summary: "No ridge is traced from an unrecognized plate. A skyline fit needs a candidate camera first.",
    metric: "not traced",
  },
  {
    id: "evidence",
    title: "Satellite / street-view evidence",
    script: "tiles.py · gsv.py",
    summary: "Evidence cards stay empty. Live imagery is not fetched for an unknown coordinate.",
    metric: "no mosaic",
  },
  {
    id: "estimate",
    title: "Camera fix",
    script: "evidence.py",
    summary:
      "No fix. This lab does not invent a lat/lng for an upload. Pick a bundled public-landmark plate, or bring your own photo only to confirm the refusal path.",
    metric: "refused",
  },
]

const UPLOAD_EVIDENCE: EvidenceCardModel[] = [
  {
    kind: "osm",
    title: "OSM geometry",
    script: "osm.py",
    body: "No hypothesis, so no geometry card.",
    metric: "no query",
    source: "mock",
    schematic: "none",
  },
  {
    kind: "skyline",
    title: "Skyline fit",
    script: "terrain.py",
    body: "No ridge to score.",
    metric: "not traced",
    source: "mock",
    schematic: "none",
  },
  {
    kind: "satellite",
    title: "Satellite",
    script: "tiles.py",
    body: "No camera fix, so no tile is requested.",
    metric: "no mosaic",
    source: "mock",
    schematic: "none",
  },
  {
    kind: "street",
    title: "Street-view style",
    script: "gsv.py",
    body: "No heading, so no street-level schematic.",
    metric: "no view",
    source: "mock",
    schematic: "none",
  },
]

export type PlanInput =
  | { kind: "sample"; sampleId: string; liveRequested: boolean; config: LiveConfig }
  | { kind: "upload"; fileName: string; liveRequested: boolean; config: LiveConfig }

export function buildPlan(input: PlanInput): SleuthPlan {
  const { mode, modeNote } = resolveRunMode(input.liveRequested, input.config)
  if (input.kind === "upload") {
    return {
      mode,
      modeNote,
      liveRequested: input.liveRequested,
      plateLabel: input.fileName || UPLOAD_PLATE_LABEL,
      steps: UPLOAD_STEPS,
      evidence: UPLOAD_EVIDENCE,
      estimate: null,
      sampleId: null,
    }
  }

  const plate = findSample(input.sampleId)
  if (!plate) {
    return {
      mode,
      modeNote,
      liveRequested: input.liveRequested,
      plateLabel: "Unknown plate",
      steps: UPLOAD_STEPS,
      evidence: UPLOAD_EVIDENCE,
      estimate: null,
      sampleId: null,
    }
  }

  return {
    mode,
    modeNote,
    liveRequested: input.liveRequested,
    plateLabel: plate.title,
    steps: stepsFor(plate),
    evidence: evidenceFor(plate, mode, input.config.maptilerKey),
    estimate: estimateFor(plate),
    sampleId: plate.id,
  }
}

export function applyOverpass(plan: SleuthPlan, elements: OverpassElement[]): SleuthPlan {
  if (plan.mode !== "live" || !plan.estimate) return plan
  const summary = summarizeOverpass(elements)
  return {
    ...plan,
    evidence: plan.evidence.map((card) => {
      if (card.kind !== "osm") return card
      return {
        ...card,
        source: "overpass",
        metric: summary.metric,
        body: `${card.body} ${summary.body}`,
      }
    }),
  }
}

export function overpassFailureNote(plan: SleuthPlan, reason: string): SleuthPlan {
  if (plan.mode !== "live") return plan
  return {
    ...plan,
    modeNote: `${plan.modeNote} Overpass failed (${reason}); the OSM card kept the canned hypothesis.`,
  }
}
