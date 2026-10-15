# PLAN — apps/dots-voice-agent

## Goal
Single-user playground that recreates the **OpenAI Dots always-on voice-call pattern** via the Realtime API — leave a call open, speak work, background queue keeps going, the agent **speaks results first** when a task lands.

Source: https://x.com/0ooooo0/status/2106742989943165018  
Pattern only. Not a wrap of the Dots product (no public Dots API).

## Single-user MVP
- **In**
  - Always-on call button (connect once; stay on the line; speak more work without hanging up)
  - Spoken tasks enqueue background jobs: web research, summary, simple file write
  - Those jobs are **mocks** (timed, canned/structured results) — enough to prove the interrupt-and-speak-first loop
  - Side **Activity** timeline (queued / running / done, with result snippets)
  - `OPENAI_API_KEY` → Vite middleware mints ephemeral Realtime client secrets; browser WebRTC call + tool calls
  - **No key** → mock/simulated voice + tasks path so `bun install && bun run dev` validates in CI/cloud without credentials
  - Type-to-speak fallback (and sample chips) so the demo is usable without a working mic
  - README + `.env.example`
- **Out**
  - Real Dots / ChatGPT desktop / computer-control / plugin graph
  - Live web browsing, real filesystem writes, Slack/Gmail
  - Multi-user, auth, production deploy, Cloudflare Pages wiring

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React + TS under `apps/dots-voice-agent/` with app-local `bunfig.toml` (`minimumReleaseAge = 259200`). Init shadcn/ui (minimalist).
2. Voice session abstraction: `MockSession` (SpeechSynthesis + typed/Web-Speech input) vs `RealtimeSession` (ephemeral token → `/v1/realtime/calls` WebRTC, function tools).
3. Background queue: enqueue on spoken/typed intent; run research/summary/file-write mocks in parallel; when a job completes, **barge in and speak the result first**, then keep the call open.
4. UI: center blob + persistent call control, captions, right-rail timeline. Status: idle / on call / listening / speaking / working.
5. Smoke path documented; attach ≥1 screenshot + ≥1 video of the mock call + queued tasks + spoken result in the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React + TS** — one-screen voice UI; Vite plugin holds `OPENAI_API_KEY` and `/api/*`
- **shadcn/ui + Tailwind** — buttons, cards, scroll area; custom blob/call chrome
- **OpenAI Realtime (GA)** — `POST /v1/realtime/client_secrets` + WebRTC `/v1/realtime/calls` when a key is set; no Agents SDK required for MVP
- **Web Speech / SpeechSynthesis** — mock path so the demo works without keys or a Realtime quota

## Follow-up — Local mode
- In: Mock / Realtime / Local selector. Local = browser VAD → `moonshine-voice` Tiny Korean sidecar (non-streaming) → optional Qwen refine → Ollama `qwen3:8b` → `speechSynthesis` (`ko-KR`). Status UI never fakes STT. Realtime silence (60s) + max session (10 min) auto hang-up.
- Out: streaming Korean ASR (not published), in-browser WASM STT as the primary engine, real tools.

## Deferred
- `@openai/agents` RealtimeAgent wrapper
- Real hosted web_search / Responses delegation
- Persistent files on disk
- Multi-dot / custom rules / proactive research loop
- Cloudflare Pages path deploy

## Success
- `cd apps/dots-voice-agent && bun install && bun run dev` works
- One PR only touches `apps/dots-voice-agent/`
- PR title: `apps/dots-voice-agent: Dots-style always-on voice agent`
- PR includes ≥1 screenshot and ≥1 video of the running app (mock path is the required validate path)
