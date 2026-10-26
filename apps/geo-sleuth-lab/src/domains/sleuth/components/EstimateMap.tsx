import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { headingWedge } from "@/domains/sleuth/geo"
import type { Estimate } from "@/domains/sleuth/types"

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const WORLD_CENTER: L.LatLngExpression = [20, 0]
const WORLD_ZOOM = 2
const BOUNDS_PAD = 0.45
const CAMERA_MARKER_RADIUS = 6
const LANDMARK_MARKER_RADIUS = 5

type EstimateMapProps = {
  estimate: Estimate | null
  showFix: boolean
}

export function EstimateMap({ estimate, showFix }: EstimateMapProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const visibleEstimate = showFix ? estimate : null

  useEffect(() => {
    const host = hostRef.current
    if (!host || mapRef.current) return
    const map = L.map(host, { zoomControl: true })
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map)
    map.setView(WORLD_CENTER, WORLD_ZOOM)
    mapRef.current = map
    const frame = requestAnimationFrame(() => {
      map.invalidateSize()
    })
    return () => {
      cancelAnimationFrame(frame)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const layer = L.layerGroup().addTo(map)
    if (!visibleEstimate) {
      map.setView(WORLD_CENTER, WORLD_ZOOM)
      return () => {
        layer.remove()
      }
    }

    const wedge = headingWedge(visibleEstimate.camera, visibleEstimate.headingDeg)
    L.polygon(
      wedge.map((point) => [point.lat, point.lng] as [number, number]),
      { color: "#c2410c", weight: 1, fillColor: "#ea580c", fillOpacity: 0.28 },
    ).addTo(layer)
    L.circle([visibleEstimate.camera.lat, visibleEstimate.camera.lng], {
      radius: visibleEstimate.radiusM,
      color: "#171717",
      weight: 1,
      fillOpacity: 0.06,
    }).addTo(layer)
    L.circleMarker([visibleEstimate.camera.lat, visibleEstimate.camera.lng], {
      radius: CAMERA_MARKER_RADIUS,
      color: "#ffffff",
      weight: 2,
      fillColor: "#c2410c",
      fillOpacity: 1,
    })
      .bindTooltip("Camera", { direction: "top" })
      .addTo(layer)
    L.circleMarker([visibleEstimate.landmark.lat, visibleEstimate.landmark.lng], {
      radius: LANDMARK_MARKER_RADIUS,
      color: "#171717",
      weight: 1,
      fillColor: "#171717",
      fillOpacity: 1,
    })
      .bindTooltip(visibleEstimate.landmarkName, { direction: "top" })
      .addTo(layer)

    const bounds = L.latLngBounds([
      [visibleEstimate.camera.lat, visibleEstimate.camera.lng],
      [visibleEstimate.landmark.lat, visibleEstimate.landmark.lng],
    ])
    map.fitBounds(bounds.pad(BOUNDS_PAD))
    const frame = requestAnimationFrame(() => {
      map.invalidateSize()
    })
    return () => {
      cancelAnimationFrame(frame)
      layer.remove()
    }
  }, [visibleEstimate])

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>Camera fix</CardTitle>
        <p className="text-xs text-muted-foreground">Orange wedge is heading. Black ring is the error radius. Black dot is the landmark.</p>
      </CardHeader>
      <CardContent>
        <div className="relative isolate z-0 h-[340px] overflow-hidden rounded-lg ring-1 ring-foreground/10">
          <div ref={hostRef} data-testid="estimate-map" className="h-full w-full" />
          {!visibleEstimate ? (
            <div className="pointer-events-none absolute inset-0 flex items-end p-3">
              <p className="rounded-md bg-background/90 px-2 py-1 text-xs text-muted-foreground">
                Run a sample plate to drop the camera pin.
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
