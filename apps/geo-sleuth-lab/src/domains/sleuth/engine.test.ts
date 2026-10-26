import { describe, expect, test } from "bun:test"
import { applyOverpass, buildPlan, gradeConfidence, overpassFailureNote, resolveRunMode } from "./engine"
import { bearingDeg, haversineM, headingWedge, WEDGE_RANGE_M } from "./geo"
import { maptilerStaticUrl, summarizeOverpass } from "./overpass"
import { SAMPLE_PLATES } from "./samples"

const OFFLINE = { liveGeoEnabled: false, maptilerKey: null }
const LIVE = { liveGeoEnabled: true, maptilerKey: "demo-key" }

describe("gradeConfidence", () => {
  test("bands", () => {
    expect(gradeConfidence(0.91)).toBe("high")
    expect(gradeConfidence(0.8)).toBe("high")
    expect(gradeConfidence(0.74)).toBe("medium")
    expect(gradeConfidence(0.55)).toBe("medium")
    expect(gradeConfidence(0.4)).toBe("low")
    expect(gradeConfidence(null)).toBe("none")
  })
})

describe("sample plans", () => {
  test("every plate points the heading at its landmark", () => {
    for (const plate of SAMPLE_PLATES) {
      const plan = buildPlan({
        kind: "sample",
        sampleId: plate.id,
        liveRequested: false,
        config: OFFLINE,
      })
      expect(plan.estimate).not.toBeNull()
      const heading = bearingDeg(plate.camera, plate.landmark)
      expect(plan.estimate?.headingDeg).toBeCloseTo(heading, 5)
      expect(plan.estimate?.grade).toBe(gradeConfidence(plate.confidence))
      expect(plan.steps).toHaveLength(5)
      expect(plan.mode).toBe("offline-mock")
      expect(plan.evidence.every((card) => card.source === "mock")).toBe(true)
    }
  })

  test("eiffel heading is northwest from the Champ de Mars", () => {
    const plate = SAMPLE_PLATES[0]
    expect(plate?.id).toBe("eiffel")
    if (!plate) return
    expect(bearingDeg(plate.camera, plate.landmark)).toBeCloseTo(323.4, 0)
  })

  test("live without the env flag stays on the replay", () => {
    const plan = buildPlan({
      kind: "sample",
      sampleId: "gate",
      liveRequested: true,
      config: OFFLINE,
    })
    expect(plan.mode).toBe("live-unavailable")
    expect(plan.modeNote).toContain("VITE_LIVE_GEO")
    expect(plan.estimate?.landmarkName).toBe("Golden Gate Bridge")
    expect(plan.evidence.every((card) => card.source === "mock")).toBe(true)
  })

  test("live with a maptiler key stamps only the satellite card", () => {
    const plan = buildPlan({
      kind: "sample",
      sampleId: "opera",
      liveRequested: true,
      config: LIVE,
    })
    expect(plan.mode).toBe("live")
    const satellite = plan.evidence.find((card) => card.kind === "satellite")
    expect(satellite?.source).toBe("maptiler")
    expect(satellite?.imageUrl).toContain("demo-key")
    expect(satellite?.imageUrl).toContain("151.21040")
    expect(plan.evidence.filter((card) => card.source === "mock")).toHaveLength(3)
  })
})

describe("uploads", () => {
  test("refuse a fix and do not emit coordinates", () => {
    const plan = buildPlan({
      kind: "upload",
      fileName: "snapshot.jpg",
      liveRequested: true,
      config: LIVE,
    })
    expect(plan.estimate).toBeNull()
    expect(plan.sampleId).toBeNull()
    const text = [...plan.steps.map((step) => step.summary), ...plan.evidence.map((card) => card.body)].join(" ")
    expect(text).not.toMatch(/\d+\.\d{3}/)
    expect(plan.steps[4]?.metric).toBe("refused")
  })
})

describe("geometry", () => {
  test("heading wedge radius", () => {
    const origin = { lat: 48.8549, lng: 2.2984 }
    const wedge = headingWedge(origin, 323.4)
    expect(wedge[0]).toEqual(origin)
    expect(wedge[wedge.length - 1]).toEqual(origin)
    const mid = wedge[Math.floor(wedge.length / 2)]
    expect(mid).toBeDefined()
    if (!mid) return
    expect(haversineM(origin, mid)).toBeCloseTo(WEDGE_RANGE_M, -1)
  })
})

describe("overpass helpers", () => {
  test("summarize named features", () => {
    const summary = summarizeOverpass([
      { tags: { name: "Eiffel Tower", tourism: "attraction" } },
      { tags: { tourism: "viewpoint" } },
      { tags: { name: "Champ de Mars" } },
    ])
    expect(summary.metric).toContain("3 OSM features")
    expect(summary.body).toContain("Eiffel Tower")
    expect(summary.body).toContain("Champ de Mars")
  })

  test("maptiler url is lng,lat", () => {
    const url = maptilerStaticUrl({ lat: -33.8599, lng: 151.2104 }, "k")
    expect(url).toContain("/151.21040,-33.85990,16/")
  })
})

describe("applyOverpass", () => {
  test("patches the OSM card only in live mode", () => {
    const plan = buildPlan({
      kind: "sample",
      sampleId: "eiffel",
      liveRequested: true,
      config: LIVE,
    })
    const enriched = applyOverpass(plan, [{ tags: { name: "Eiffel Tower" } }])
    const osm = enriched.evidence.find((card) => card.kind === "osm")
    expect(osm?.source).toBe("overpass")
    expect(osm?.body).toContain("Eiffel Tower")
    expect(enriched.evidence.find((card) => card.kind === "street")?.source).toBe("mock")

    const offline = buildPlan({
      kind: "sample",
      sampleId: "eiffel",
      liveRequested: false,
      config: LIVE,
    })
    expect(applyOverpass(offline, [{ tags: { name: "Nope" } }]).evidence[0]?.source).toBe("mock")
  })

  test("records an overpass failure without dropping the fix", () => {
    const plan = buildPlan({
      kind: "sample",
      sampleId: "colosseum",
      liveRequested: true,
      config: LIVE,
    })
    const failed = overpassFailureNote(plan, "timeout")
    expect(failed.modeNote).toContain("timeout")
    expect(failed.estimate?.landmarkName).toBe("Colosseum")
  })
})

describe("resolveRunMode", () => {
  test("offline when the toggle is off", () => {
    expect(resolveRunMode(false, LIVE).mode).toBe("offline-mock")
  })
})
