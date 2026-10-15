# Opus Motion Studio

Single-user playground for the [Opus 5.5 motion-design pipeline](https://x.com/0xMovez/status/2104216919033192746): one prompt → deterministic `seek(t)` canvas preview → H.264 MP4.

Works offline. Built-in sample scenes compile without an LLM key. Optional `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` turn the prompt into scene JSON.

## Run

```bash
cd apps/motion-studio
bun install
bun run dev
```

Open http://localhost:5173

Export needs system `ffmpeg` (`libx264`, `yuv420p`). Preview does not.

## Use

1. Pick a sample chip or type a prompt.
2. **Generate scene** compiles a `seek(t)` scene (sample mapper, or LLM if a key is set).
3. Play / scrub the 16:9 stage. Space toggles playback.
4. **Export MP4** walks frames on the canvas and encodes with ffmpeg.

`.env.example` lists the optional keys. Copy to `.env` in this folder.

## Engine

- Closed-form springs + `track(t, keys)` — no `requestAnimationFrame` state in render mode.
- Seeded grain (`mulberry32`), never `Math.random`.
- Same scene graph for preview and export.

## Out of scope

Remotion/HyperFrames project export, Playwright headless capture, synthesized score, critique loop.
