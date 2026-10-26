export type LatLng = {
  lat: number
  lng: number
}

export type SampleId = "eiffel" | "gate" | "colosseum" | "opera"

export type SchematicId = SampleId | "none"

export type ConfidenceGrade = "high" | "medium" | "low" | "none"

export type PipelineStepId = "cues" | "osm" | "skyline" | "evidence" | "estimate"

export type PipelineStep = {
  id: PipelineStepId
  title: string
  script: string
  summary: string
  metric: string
}

export type EvidenceKind = "osm" | "skyline" | "satellite" | "street"

export type EvidenceSource = "mock" | "overpass" | "maptiler"

export type EvidenceCardModel = {
  kind: EvidenceKind
  title: string
  script: string
  body: string
  metric: string
  source: EvidenceSource
  imageUrl?: string
  skyline?: {
    photo: number[]
    rendered: number[]
  }
  schematic: SchematicId
}

export type Estimate = {
  camera: LatLng
  landmark: LatLng
  landmarkName: string
  headingDeg: number
  radiusM: number
  confidence: number
  grade: ConfidenceGrade
  placeLabel: string
}

export type LiveConfig = {
  liveGeoEnabled: boolean
  maptilerKey: string | null
}

export type RunMode = "offline-mock" | "live-unavailable" | "live"

export type SleuthPlan = {
  mode: RunMode
  modeNote: string
  liveRequested: boolean
  plateLabel: string
  steps: PipelineStep[]
  evidence: EvidenceCardModel[]
  estimate: Estimate | null
  sampleId: SampleId | null
}

export type SamplePlate = {
  id: SampleId
  title: string
  place: string
  plateSrc: string
  camera: LatLng
  landmark: LatLng
  landmarkName: string
  radiusM: number
  confidence: number
  cues: { summary: string; metric: string }
  osm: { summary: string; metric: string }
  skyline: {
    summary: string
    metric: string
    photo: number[]
    rendered: number[]
  }
  satellite: { summary: string; metric: string }
  street: { summary: string; metric: string }
}
