# PLAN — apps/grok-voice-transcribe

## Goal
Single-user playground that records from the mic or uploads an audio file and transcribes it with **xAI `grok-voice-transcribe-2.0`**, showing word timestamps, speaker labels, and detected language.

## Single-user MVP
- In: mic record + file upload, Bun server proxy to `POST https://api.x.ai/v1/stt` (key never in the browser), word-level timestamps, speaker diarization, language detection, mock/demo mode when `XAI_API_KEY` is unset so `bun install && bun run dev` works, README + `.env.example`
- Out: live WebSocket streaming STT, multichannel per-track view, accounts, persistence, Cloudflare deploy

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/grok-voice-transcribe/` from `bunx create-vite` with app-local `bunfig.toml` (`minimumReleaseAge = 259200`).
2. Bun `server/` on an API port, proxied by Vite: `POST /api/transcribe` (multipart file + options) and `GET /api/status` (live vs demo). Forward `model=grok-voice-transcribe-2.0`, `diarize`, `format`, `language`, `filler_words`, `keyterm` to xAI. If no key, return a realistic mock matching the official response shape.
3. Minimalist shadcn/ui playground: record / drop audio, option toggles, result panel (full text, language + duration, speaker-colored words with start/end).
4. README + `.env.example`; smoke `bun install && bun run dev`; attach screenshot + short video in the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen playground without a heavy app framework
- **shadcn/ui + Tailwind** — minimalist record/upload/result chrome
- **Bun.serve proxy** — keeps `XAI_API_KEY` server-side; Vite proxies `/api`
- **xAI Speech-to-Text** (`grok-voice-transcribe-2.0`, `POST /v1/stt`) — batch transcription with timestamps + diarization

## Deferred
- WebSocket live captions (`wss://api.x.ai/v1/stt`)
- Multichannel / Smart Turn / VAD tuning UI
- Cloudflare Pages path deploy
- Saved history / multi-user

## Success
- `cd apps/grok-voice-transcribe && bun install && bun run dev` works with no key (demo mode)
- One PR only touches `apps/grok-voice-transcribe/`
- PR includes ≥1 screenshot and ≥1 video of a transcription (demo or live)

## Source
https://x.com/RealChickenBoy9/status/2101074459985924287
