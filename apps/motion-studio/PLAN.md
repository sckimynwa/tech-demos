# PLAN — apps/motion-studio

## Goal
Single-user playground that turns one prompt into a short, deterministic motion graphic: live `seek(t)` canvas preview plus an exportable H.264 MP4.

## Single-user MVP
- In: prompt field, built-in sample chips, Generate, 16:9 preview with play/scrub, scene inspector, Export MP4, README + `.env.example`, `bun install && bun run dev`
- Offline path: no LLM key required — keyword/sample compiler emits a valid scene
- Optional: `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` for prompt → scene JSON codegen
- Out: multi-user, cloud render farm, Remotion project export, HyperFrames, ElevenLabs, critique loop, synthesized soundtrack, Playwright headless capture

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React + TS under `apps/motion-studio/` with local `bunfig.toml` (`minimumReleaseAge = 259200`).
2. Author a closed-form spring + `track()` motion lib and a canvas `seek(t)` renderer (pure function of time; seeded noise only).
3. Ship 3–4 built-in sample scenes (showreel, product launch, beat grid, logo lockup) and an offline prompt → scene mapper.
4. One-screen studio UI (prompt / stage / timeline / inspector / export). Tailwind + shadcn-like primitives.
5. Server routes in the Vite/Bun dev process: `POST /api/compile` (sample or LLM) and `POST /api/export` (JPEG frames → ffmpeg → MP4).
6. README + `.env.example`; attach screenshot + short video of preview and export.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React + TypeScript** — one-screen studio without framework-grade routing
- **Canvas `seek(t)` engine** — Opus Motion Studio route A (deterministic frames; no Remotion install)
- **ffmpeg** (system) — H.264 yuv420p encode from exported frames
- **Optional OpenAI / Anthropic** — prompt → scene JSON when a key is present
- **Fable 5 cloud agent** — implementer

## Deferred
- Playwright `index.html` + `render.mjs` headless capture
- Remotion / HyperFrames project scaffolds
- Synthesized score + beat-grid audio
- Contact-sheet critique loop
- Cloudflare Pages path deploy

## Success
- `cd apps/motion-studio && bun install && bun run dev` works
- Preview plays a sample with no API key; Export downloads an MP4
- One PR only touches `apps/motion-studio/`
- PR includes ≥1 screenshot and ≥1 video of preview/export

## Source
https://x.com/0xMovez/status/2104216919033192746
