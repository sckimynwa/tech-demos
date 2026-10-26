import type { LiveConfig } from "@/domains/sleuth/types"

export function readLiveConfig(): LiveConfig {
  const key = import.meta.env.VITE_MAPTILER_KEY
  return {
    liveGeoEnabled: import.meta.env.VITE_LIVE_GEO === "1",
    maptilerKey: typeof key === "string" && key.length > 0 ? key : null,
  }
}
