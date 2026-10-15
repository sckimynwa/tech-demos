# PLAN — apps/muse-spark

## Goal
Single-user playground that streams **Muse Spark** over Meta Model API (OpenAI-compatible) and runs a 1–2 step tool agent loop in a minimal chat UI.

Source: [yulmu_coffee / Muse + Claude](https://x.com/yulmu_coffee/status/2104085304336654419) — personal Muse agent + Model API (`https://muse.ai`, Meta Model API).

## Single-user MVP
- In: chat composer, SSE streaming tokens, visible tool-call / tool-result cards, 1–2 local tools (`get_current_time`, `get_weather`), mock mode when `MODEL_API_KEY` is unset, live mode when set (key stays server-side), README + `.env.example`, `bun install && bun run dev`
- Out: auth/multi-user, Muse.ai product login, Claude Code / Muse VM pairing, image/PDF/video input, search grounding, Cloudflare deploy, conversation persistence

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/muse-spark/` with app-local `bunfig.toml` (`minimumReleaseAge = 259200`). Official `create-vite` skeleton; shadcn/ui for button/input/card/badge.
2. Bun API (`/api/chat` SSE, `/api/health`): OpenAI-compatible Chat Completions to `https://api.meta.ai/v1` with model `muse-spark` (override via `MODEL`). Stream deltas; if the model returns `tool_calls`, execute locally and continue (max 2 rounds). Never send `MODEL_API_KEY` to the browser.
3. Mock provider when the key is missing: stream token-by-token replies and force a realistic tool loop for time/weather prompts so the playground is demoable without Meta credentials.
4. One-screen UI: transcript, spark/tool traces, mock/live pill, suggested prompts that trigger tools. Smoke path documented; attach screenshot + short video of a streaming tool loop in the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen playground without a heavy app framework
- **shadcn/ui + Tailwind** — minimalist chat chrome
- **Meta Model API** (`https://api.meta.ai/v1`, Chat Completions + tools) — OpenAI-compatible Muse Spark surface; key via `MODEL_API_KEY`
- **NDJSON/SSE over Bun.serve** — stream tokens and tool events to the client

## Deferred
- Muse.ai hosted agent / virtual computer
- Responses API reasoning replay (`reasoning.encrypted_content`)
- Built-in `web_search` / multimodal parts
- Cloudflare Pages path deploy
- Multi-conversation history

## Success
- `cd apps/muse-spark && bun install && bun run dev` works
- One PR only touches `apps/muse-spark/`
- PR includes ≥1 screenshot and ≥1 video of streaming chat + a tool loop (mock is enough)
