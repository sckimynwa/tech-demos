# Geo Sleuth Lab

Browser playground for the pipeline behind [geo-sleuth](https://github.com/Oldcircle/geo-sleuth): image cues, an OpenStreetMap hypothesis, an elevation / skyline check, satellite and street-view-style evidence, then a camera fix (lat/lng, heading, error radius) on a map.

This app does **not** install the agent skill or run its Python scripts. Sample plates are synthetic illustrations of public landmarks with canned results, so the demo runs with no API keys. The step labels use the upstream script names (`intake.py`, `osm.py`, `terrain.py fit`, `tiles.py`, `gsv.py`, `evidence.py`) so you can see what each stage is for.

## Privacy

Use your own photos or public landmarks only. Not for stalking or tracking people.

This demo never uses personal location tracking. EXIF GPS is ignored. An uploaded image is not geolocated — the pipeline refuses a fix instead of inventing one.

## Run

```bash
cd apps/geo-sleuth-lab
bun install
bun run dev
```

Open the URL Vite prints. Pick a plate and press **Run sleuth**.

## Live fetches (optional)

Default is the offline replay. The **Live fetches** switch does nothing networked unless you opt in:

| Env | Effect |
| --- | --- |
| `VITE_LIVE_GEO=1` | OSM step queries the public Overpass API around the **canned** sample viewpoint. |
| `VITE_MAPTILER_KEY` | With live mode on, the satellite card loads a MapTiler static image at that same canned point. |

If the switch is on and `VITE_LIVE_GEO` is unset, the run stays on the mock and says so. Copy `.env.example` to `.env.local` if you want to try it. Uploads still refuse a fix.

## Upstream

[Oldcircle/geo-sleuth](https://github.com/Oldcircle/geo-sleuth) — MIT agent skill. Install reference for the real skill (not required here): `npx skills add Oldcircle/geo-sleuth`.

Their responsible-use line matches this lab: run it on your own photos or ones you have permission to analyze, never to find people who have not agreed to be found.
