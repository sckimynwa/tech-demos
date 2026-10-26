# PLAN — apps/geo-sleuth-lab

## Goal
A single-user browser playground that shows how a geo-sleuth-style pipeline estimates where a photo was taken and visualizes the evidence (map pin, heading, OSM / elevation / satellite comparison cards).

## Single-user MVP
- In:
  - Pick one of four bundled synthetic plates of public landmarks, or upload an image.
  - Run a visible multi-step sleuth: image cues → OSM / terrain hypothesis → elevation / skyline check → satellite and street-view-style evidence → estimated lat/lng, camera heading, and error radius on a map.
  - Confidence grade plus step-by-step reasoning cards.
  - Default offline mock with canned, realistic results for the four landmarks so the demo runs with no secrets.
  - Optional live toggle. If `VITE_LIVE_GEO=1`, the OSM step tries a public Overpass fetch around the canned viewpoint and, when `VITE_MAPTILER_KEY` is set, the satellite card requests a MapTiler static image. If those env keys are absent, the run stays on mock and says so.
  - Visible privacy disclaimer: use your own photos or public landmarks only; not for stalking or tracking people.
  - README with what it demos, the privacy note, `bun install && bun run dev`, and a link to https://github.com/Oldcircle/geo-sleuth.
- Out:
  - Installing the geo-sleuth agent skill (`npx skills add`) or its Python / Playwright runtime as a required path.
  - Real vision, OCR, reverse-image search, or EXIF GPS reads (uploads do not get an invented fix, and GPS metadata is ignored).
  - Personal location tracking, surveillance, or doxxing.
  - Scraping private or authenticated maps.
  - Cloudflare deploy, auth, multi-user, and a second app or repo.

## Tasks (vertical slices)
1. Scaffold Vite + React + TypeScript with `bunx create-vite` (`--no-immediate`), then add `bunfig.toml` (`minimumReleaseAge = 259200`) before `bun install`. Init shadcn/ui on the Vite template with the minimalist base-nova preset.
2. Ship four synthetic public-landmark plates and a pure sleuth engine: canned pipeline, confidence grade, heading from camera to landmark, and an explicit no-fix path for uploads.
3. Build the one-screen playground: plate strip, run control, live toggle, animated stepper, Leaflet map (pin, heading wedge, error radius), reasoning and evidence cards, privacy banner.
4. Cover the engine with a small `bun test` suite (grade, heading, sample fix, upload refusal, live-mode gate). Skip git hooks.
5. README. Verify in the browser with a sample plate, then attach one screenshot and one short video to the PR.

## Stack
- **Bun** — repo runtime, installer, and `bun test`.
- **Vite + React + TypeScript** — official `create-vite` scaffold; one screen, no server framework.
- **Tailwind CSS + shadcn/ui (base-nova)** — minimalist preset; button, card, badge, switch, alert, progress.
- **Leaflet** — map pin, heading wedge, and error circle on public OSM tiles. Imperative Leaflet (no React wrapper) to keep the map mount obvious.
- **Public Overpass + optional MapTiler** — live enrichment only when env flags/keys exist. Mock is the default and the fallback.
- **Hand-authored SVG plates** — synthetic landmark illustrations, so the demo never bundles photos of people or private places.

## Deferred
- The upstream skill’s Python toolbox (`intake.py`, `terrain.py`, `doctor.py`, street-view matching). The UI names those scripts as the pipeline being illustrated; it does not shell out to them.
- A vision model that could honestly score an arbitrary upload.
- EXIF parsing, reverse image search, and Baidu/Yandex.
- Satellite/street-view providers that need accounts beyond the optional MapTiler key.
- Cloudflare Pages, tracking-file edits outside this app, and git hooks.

## Success
- `cd apps/geo-sleuth-lab && bun install && bun run dev` works.
- The PR only adds `apps/geo-sleuth-lab/`.
- PLAN matches the MVP above.
- The running UI shows the privacy line, and the PR includes at least one screenshot and one video of a public-landmark sample run.
