import type { LatLng } from "@/domains/sleuth/types"

export const EARTH_RADIUS_M = 6_371_000
export const WEDGE_HALF_ANGLE_DEG = 24
export const WEDGE_RANGE_M = 220
export const WEDGE_ARC_STEPS = 12

const FULL_CIRCLE_DEG = 360
const HALF_TURN_DEG = 180

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / HALF_TURN_DEG
}

function toDegrees(radians: number): number {
  return (radians * HALF_TURN_DEG) / Math.PI
}

export function bearingDeg(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const y = Math.sin(deltaLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng)
  return (toDegrees(Math.atan2(y, x)) + FULL_CIRCLE_DEG) % FULL_CIRCLE_DEG
}

export function haversineM(from: LatLng, to: LatLng): number {
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const deltaLat = lat2 - lat1
  const deltaLng = toRadians(to.lng - from.lng)
  const chord =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(chord))
}

export function destination(from: LatLng, bearing: number, distanceM: number): LatLng {
  const angular = distanceM / EARTH_RADIUS_M
  const theta = toRadians(bearing)
  const lat1 = toRadians(from.lat)
  const lng1 = toRadians(from.lng)
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(theta),
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    )
  return { lat: toDegrees(lat2), lng: toDegrees(lng2) }
}

export function headingWedge(origin: LatLng, heading: number): LatLng[] {
  const start = heading - WEDGE_HALF_ANGLE_DEG
  const sweep = WEDGE_HALF_ANGLE_DEG * 2
  const arc: LatLng[] = [origin]
  for (let step = 0; step <= WEDGE_ARC_STEPS; step += 1) {
    const bearing = start + (sweep * step) / WEDGE_ARC_STEPS
    arc.push(destination(origin, bearing, WEDGE_RANGE_M))
  }
  arc.push(origin)
  return arc
}

export function formatCoordinate(value: number, positive: string, negative: string): string {
  const hemisphere = value >= 0 ? positive : negative
  return `${Math.abs(value).toFixed(5)}° ${hemisphere}`
}

export function formatLatLng(point: LatLng): string {
  return `${formatCoordinate(point.lat, "N", "S")}, ${formatCoordinate(point.lng, "E", "W")}`
}

export function formatHeading(heading: number): string {
  return `${Math.round(heading)}°`
}
