# dots-voice-agent

Single-user playground that recreates the **OpenAI Dots always-on voice-call pattern**. It does **not** wrap the Dots product (no public Dots API).

Source: https://x.com/0ooooo0/status/2106742989943165018

Leave the call up. Speak (or type) work. Research / summary / file-write jobs run in a background queue. When a job lands, the agent **barges in and speaks the result first**. A side Activity timeline shows the queue.

Three modes in the header: **Mock** / **Realtime** / **Local**. Mock and Realtime behavior is unchanged from the first cut.

## Run

```bash
cd apps/dots-voice-agent
bun install
bun run dev
```

Open http://localhost:5173

No `OPENAI_API_KEY` is required. Default is **Mock**: type-to-speak, sample chips, `speechSynthesis` barge-in, mocked executors.

## Modes

| Mode | STT | LLM / voice | Cost |
| --- | --- | --- | --- |
| **Mock** | none (type / chips) | canned confirmations + browser TTS | $0 |
| **Realtime** | OpenAI Realtime WebRTC | OpenAI Realtime | metered — see guards below |
| **Local** | Moonshine Tiny Korean (sidecar) | Qwen via Ollama + browser TTS (`ko-KR` if present) | $0 API |

### Optional Realtime

Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. The Realtime selector unlocks. Vite mints an ephemeral client secret; the key never ships to the client.

Cost-safety (Realtime only):

- hang up after **N seconds of silence** (default `60`)
- hang up at **max session length** (default `600` = 10 min)

```bash
REALTIME_SILENCE_TIMEOUT_S=60
REALTIME_MAX_SESSION_S=600
```

The live UI shows remaining cap / silence. Mock and Local are not timed out this way.

### Local mode (zero API cost)

Pipeline:

1. Browser energy **VAD** waits for end of utterance (Moonshine Korean **does not stream**).
2. Segment → Python sidecar → `moonshine-voice` `Transcriber.transcribe_without_streaming` on **Tiny Korean**.
3. Optional Qwen refine (`LOCAL_REFINE=1`, default on).
4. Qwen (`LOCAL_LLM_MODEL`, default `qwen3:8b`) picks a tool or a spoken reply.
5. Browser `speechSynthesis`, `ko-KR` voice when the OS has one.

Status pills in Local mode are live probes. If Moonshine or Ollama is missing, the UI says so. **Transcripts are never invented.**

#### Moonshine sidecar

Official runtime is the Python package [`moonshine-voice`](https://moonshine-voice.readthedocs.io/en/latest/) (ONNX Runtime / `.ort`), not a JS/WASM port. Korean only publishes **Tiny, non-streaming** ([available models](https://moonshine-voice.readthedocs.io/en/latest/models/available-models/)). That is why VAD lives in the browser: cut the phrase, then transcribe the whole clip. `max_tokens_per_second=13` is required for Korean.

RAM: Tiny Korean is ~26M params. Plan **0.5–1 GB** RSS for the sidecar once weights are cached.

```bash
cd apps/dots-voice-agent
python3 -m venv sidecar/.venv
sidecar/.venv/bin/pip install -r sidecar/requirements.txt
# optional cache dir
export MOONSHINE_VOICE_CACHE="$PWD/sidecar/.cache"
sidecar/.venv/bin/python sidecar/server.py
# or: bun run sidecar   (uses system python3)
```

First boot downloads Tiny Korean into `MOONSHINE_VOICE_CACHE` or the user cache (`~/.cache/moonshine_voice` on Linux). Later boots are offline.

Health: `GET http://127.0.0.1:8765/health`  
Transcribe: `POST /transcribe` `{ "pcm16": "<base64 int16le>", "sampleRate": 16000 }`

Vite proxies `/api/local/transcribe` and `/api/local/status` so the browser never talks to the sidecar port directly.

#### Ollama + Qwen

```bash
# https://ollama.com — install the daemon, then:
ollama pull qwen3:8b
# if 8B is too large, set LOCAL_LLM_MODEL to the closest Qwen tag you actually pulled
# e.g. qwen2.5:7b
```

| Var | Default | Role |
| --- | --- | --- |
| `OLLAMA_HOST` | `http://127.0.0.1:11434` | Ollama base URL |
| `LOCAL_LLM_MODEL` | `qwen3:8b` | Chat + optional ASR refine |
| `LOCAL_REFINE` | `1` | Moonshine → Qwen cleanup before the agent turn |
| `MOONSHINE_SIDECAR_URL` | `http://127.0.0.1:8765` | STT sidecar |

An 8B Qwen Q4 is several GB. The Local status row **Model present** stays red until that tag exists. The app will not pretend Qwen answered.

## What it does

1. **Start call** stays on the line. You do not hang up to assign more work.
2. Speak or type a task, or click the sample chips.
3. The agent confirms, then the job appears in the right-rail queue.
4. You can queue another task while the first is still running.
5. When a job finishes, the agent interrupts and speaks the result first.

Background tools are still mocks: timed, structured results. Enough to prove the interrupt-and-speak-first loop.

## Scripts

```bash
bun run dev        # Vite on :5173 — /api/config, Realtime secret, /api/local/*
bun run sidecar    # Moonshine Tiny Korean STT on :8765
bun run typecheck
bun run test
bun run build
```
