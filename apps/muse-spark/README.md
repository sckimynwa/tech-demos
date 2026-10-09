# Muse Spark playground

Single-user streaming chat for **Muse Spark** over Meta Model API.

Source bookmark: [yulmu_coffee — Muse + Claude](https://x.com/yulmu_coffee/status/2104085304336654419).

```bash
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173).

## What you get

- Vite + React chat UI
- Bun `/api/chat` SSE proxy — `MODEL_API_KEY` stays on the server
- OpenAI-compatible Chat Completions at `https://api.meta.ai/v1` (model `muse-spark`)
- 1–2 step tool loop: `get_current_time`, `get_weather`
- **Mock mode** when the key is unset — still streams tokens and fires tools

## Live vs mock

Copy `.env.example` → `.env` if you want live Muse Spark:

```bash
MODEL_API_KEY=your-key
MODEL=muse-spark
MODEL_API_BASE=https://api.meta.ai/v1
```

Leave `MODEL_API_KEY` empty (or unset) for mock. Meta currently publishes versioned IDs (`muse-spark-1.3`, …). If `muse-spark` 404s, the server retries `muse-spark-1.3` once.

## Suggested prompts

- `What time is it in Seoul?`
- `What's the weather in Tokyo — do I need an umbrella?`
- `Seoul weather and local time. Should I go for a walk?`

## Scripts

| Script | What |
| --- | --- |
| `bun run dev` | API on `:3001` + Vite on `:5173` (`/api` proxied) |
| `bun run typecheck` | `tsc -b` |
| `bun run build` | production client build |
