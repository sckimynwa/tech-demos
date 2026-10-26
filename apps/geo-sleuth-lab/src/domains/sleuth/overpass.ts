import type { LatLng } from "@/domains/sleuth/types"

export const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"
export const OVERPASS_TIMEOUT_MS = 8_000
export const OVERPASS_AROUND_M = 450
export const OVERPASS_NAME_LIMIT = 4

export type OverpassElement = {
  tags?: Record<string, string>
}

export function overpassQuery(camera: LatLng): string {
  const { lat, lng } = camera
  return `[out:json][timeout:12];(node(around:${OVERPASS_AROUND_M},${lat},${lng})[tourism];way(around:${OVERPASS_AROUND_M},${lat},${lng})[man_made];way(around:${OVERPASS_AROUND_M},${lat},${lng})[historic];);out tags 12;`
}

export function summarizeOverpass(elements: OverpassElement[]): {
  metric: string
  body: string
} {
  const names = elements
    .map((element) => element.tags?.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, OVERPASS_NAME_LIMIT)
  const metric = `${elements.length} OSM features within ${OVERPASS_AROUND_M} m`
  const body =
    names.length > 0
      ? `Live Overpass names: ${names.join(", ")}. The count replaces the canned co-occurrence list. The camera fix is still the offline replay.`
      : "Live Overpass returned features, but none carried a name tag. The count is live. The narrative stays the canned hypothesis."
  return { metric, body }
}

export async function fetchOverpass(
  camera: LatLng,
  fetchImpl: typeof fetch,
  timeoutMs = OVERPASS_TIMEOUT_MS,
): Promise<OverpassElement[]> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: overpassQuery(camera) }),
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(`Overpass HTTP ${response.status}`)
    }
    const payload = (await response.json()) as { elements?: OverpassElement[] }
    return payload.elements ?? []
  } finally {
    clearTimeout(timer)
  }
}

export function maptilerStaticUrl(camera: LatLng, key: string): string {
  const lat = camera.lat.toFixed(5)
  const lng = camera.lng.toFixed(5)
  return `https://api.maptiler.com/maps/satellite/static/${lng},${lat},16/640x360.jpg?key=${encodeURIComponent(key)}`
}
