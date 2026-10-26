import type { SamplePlate } from "@/domains/sleuth/types"

export const SAMPLE_PLATES: SamplePlate[] = [
  {
    id: "eiffel",
    title: "Iron lattice from the Champ de Mars",
    place: "Paris, France",
    plateSrc: "/plates/eiffel.svg",
    camera: { lat: 48.8549, lng: 2.2984 },
    landmark: { lat: 48.85837, lng: 2.294481 },
    landmarkName: "Eiffel Tower",
    radiusM: 28,
    confidence: 0.86,
    cues: {
      summary:
        "Synthetic plate, no people. EXIF GPS is ignored. Four iron legs, a tapering spire, and a gravel axis aimed at the base. Lawn in the foreground, nothing readable.",
      metric: "GPS ignored · 3 anchors",
    },
    osm: {
      summary:
        "Lattice-plus-axis is a monument template, not a street template. Offline pack keeps tourism=attraction beside man_made=tower on a formal garden axis. Six namesakes worldwide; the river corridor and the axial lawn leave one compound.",
      metric: "6 namesakes → 1 compound",
    },
    skyline: {
      summary:
        "The ridge is the tower itself. terrain.py fit from the lawn matches leg spacing and the first-platform pinch. Residual 4.2 px after a 0.3° roll.",
      metric: "4.2 px · roll 0.3°",
      photo: [0.74, 0.7, 0.58, 0.4, 0.18, 0.06, 0.16, 0.38, 0.56, 0.68, 0.74],
      rendered: [0.72, 0.68, 0.56, 0.42, 0.2, 0.09, 0.18, 0.4, 0.55, 0.67, 0.73],
    },
    satellite: {
      summary:
        "Schematic nadir of the Champ de Mars axis. The camera sits on the lawn looking along the gravel. The tower footprint is the dark square at the end of the axis.",
      metric: "mock mosaic · z16",
    },
    street: {
      summary:
        "Lawn-level schematic, not a scraped panorama. Iron legs frame the axis. No faces, plates, or house numbers.",
      metric: "schematic view",
    },
  },
  {
    id: "gate",
    title: "Suspension span from the north vista",
    place: "San Francisco, United States",
    plateSrc: "/plates/gate.svg",
    camera: { lat: 37.8324, lng: -122.4795 },
    landmark: { lat: 37.819929, lng: -122.478255 },
    landmarkName: "Golden Gate Bridge",
    radiusM: 45,
    confidence: 0.91,
    cues: {
      summary:
        "Synthetic plate, no people. International-orange suspension, two towers, a deck falling toward a strait, and a fog bank on the left headland. No text and no plates.",
      metric: "GPS ignored · 4 anchors",
    },
    osm: {
      summary:
        "osm.py route treats the span as a ruler. Main-span class is about 1,280 m. Three orange suspension bridges survive the color and tower count; Marin headland on the camera-left of a south-facing view leaves the Golden Gate.",
      metric: "3 spans → 1",
    },
    skyline: {
      summary:
        "Headland ridge under the fog, towers punched through it. Fit along the north vista: this site 3.1 px, the next coastal span 11 px.",
      metric: "3.1 px vs 11 px",
      photo: [0.62, 0.58, 0.42, 0.16, 0.48, 0.6, 0.18, 0.5, 0.64, 0.7, 0.72],
      rendered: [0.6, 0.56, 0.4, 0.18, 0.46, 0.58, 0.2, 0.5, 0.63, 0.69, 0.71],
    },
    satellite: {
      summary:
        "Schematic nadir of the strait. North vista at the top of the frame, deck running south. Fog is drawn, not sensed.",
      metric: "mock mosaic · z14",
    },
    street: {
      summary:
        "Vista-point schematic looking down the deck. Cables and the far tower only. No vehicles and no people.",
      metric: "schematic view",
    },
  },
  {
    id: "colosseum",
    title: "Arcade wall from the southeast approach",
    place: "Rome, Italy",
    plateSrc: "/plates/colosseum.svg",
    camera: { lat: 41.88905, lng: 12.49435 },
    landmark: { lat: 41.89021, lng: 12.492231 },
    landmarkName: "Colosseum",
    radiusM: 18,
    confidence: 0.88,
    cues: {
      summary:
        "Synthetic plate, no people. Three stacked arcades, an elliptical plan, travertine color, umbrella pines. No modern signage.",
      metric: "GPS ignored · 3 anchors",
    },
    osm: {
      summary:
        "historic=monument with an elliptical footprint. Two amphitheatres of this size sit in the offline gazetteer. The slope of the Palatine on the right keeps Rome and drops El Jem.",
      metric: "2 amphitheatres → 1",
    },
    skyline: {
      summary:
        "No distant range. The outer wall's arcade rhythm is the ridge. Overlay residual 2.6 px, so the error radius stays tight.",
      metric: "2.6 px residual",
      photo: [0.55, 0.48, 0.42, 0.38, 0.36, 0.37, 0.4, 0.46, 0.52, 0.58, 0.62],
      rendered: [0.54, 0.47, 0.41, 0.37, 0.35, 0.37, 0.41, 0.47, 0.53, 0.58, 0.61],
    },
    satellite: {
      summary:
        "Schematic nadir of the ellipse and the straight southeast approach. Camera dot is on the road, not inside the arena.",
      metric: "mock mosaic · z17",
    },
    street: {
      summary:
        "Approach-road schematic. Outer arches and a pine. No crowds, no vendors, no readable banners.",
      metric: "schematic view",
    },
  },
  {
    id: "opera",
    title: "Shell roofs from Circular Quay",
    place: "Sydney, Australia",
    plateSrc: "/plates/opera.svg",
    camera: { lat: -33.8599, lng: 151.2104 },
    landmark: { lat: -33.856784, lng: 151.215297 },
    landmarkName: "Sydney Opera House",
    radiusM: 55,
    confidence: 0.74,
    cues: {
      summary:
        "Synthetic plate, no people. A cluster of white shells on a harbor point and ferry wash in the foreground. No tower and no readable sign.",
      metric: "GPS ignored · 2 anchors",
    },
    osm: {
      summary:
        "tourism=attraction on a peninsula in a drowned valley. Four shell-roof lookalikes survive the first cut. Shell count plus the quay edge leaves Bennelong Point, but the foreshore still trades places with the botanic-garden bank.",
      metric: "4 roofs → 1 point, bank ambiguous",
    },
    skyline: {
      summary:
        "Shell crests are the ridge. Residual 7.8 px — the quay camera sits left of the best shell tangent, so the radius stays wide.",
      metric: "7.8 px · wide radius",
      photo: [0.7, 0.66, 0.5, 0.28, 0.42, 0.22, 0.36, 0.2, 0.48, 0.64, 0.7],
      rendered: [0.68, 0.6, 0.46, 0.34, 0.4, 0.3, 0.34, 0.28, 0.5, 0.62, 0.68],
    },
    satellite: {
      summary:
        "Schematic nadir of the quay and the point. The pin is on the west quay. The opposite foreshore is drawn because the skyline did not kill it.",
      metric: "mock mosaic · z16",
    },
    street: {
      summary:
        "Quay-level schematic across the water. Shells only. No ferry name, no faces.",
      metric: "schematic view",
    },
  },
]

export function findSample(id: string): SamplePlate | undefined {
  return SAMPLE_PLATES.find((plate) => plate.id === id)
}
