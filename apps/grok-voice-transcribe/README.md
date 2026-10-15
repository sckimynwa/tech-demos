# Grok Voice Transcribe 2.0 playground

Single-user STT playground for xAI [`grok-voice-transcribe-2.0`](https://docs.x.ai/developers/model-capabilities/audio/speech-to-text). Record from the mic or upload a file; a Bun proxy calls `POST https://api.x.ai/v1/stt` and the UI shows full text, detected language, speaker labels, and word timestamps.

Source bookmark: [RealChickenBoy9 / Grok Voice Transcribe 2.0](https://x.com/RealChickenBoy9/status/2101074459985924287)

```bash
cd apps/grok-voice-transcribe
bun install
bun run dev
```

Open http://localhost:5173. No API key is required.

## How it works

```
Vite + React (5173) ──/api proxy──▶ Bun.serve (3001)
                                      ├─ GET  /api/status
                                      └─ POST /api/transcribe
                                           ├─ demo: mock transcript (no XAI_API_KEY)
                                           └─ live: multipart → api.x.ai/v1/stt
```

- The browser never sees `XAI_API_KEY`. Copy `.env.example` → `.env` and set the key to hit the real model.
- Demo mode always works: it returns a canned two-speaker clip (English by default; Korean/Spanish if the filename or language option says so) with timestamps, optional diarization, ITN-style number formatting, and fillers.
- **Try sample clip** loads `public/sample-meeting.wav` so you can exercise the path without a microphone.

## Options forwarded to xAI

| UI | Multipart field |
| --- | --- |
| Speaker labels | `diarize=true` |
| Written numbers | `format=true` (+ `language`, defaults to `en` when format is on) |
| Keep fillers | `filler_words=true` |
| Language | `language` (empty = auto-detect) |
| Key terms | repeated `keyterm` |

## Scripts

`bun run dev` starts the API and Vite. Also: `dev:api`, `dev:web`, `typecheck`, `build`, `test`, `lint`.
