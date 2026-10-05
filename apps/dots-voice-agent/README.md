# dots-voice-agent

Single-user playground that recreates the **OpenAI Dots always-on voice-call pattern** via the Realtime API. It does **not** wrap the Dots product (no public Dots API).

Source: https://x.com/0ooooo0/status/2106742989943165018

Leave the call up. Speak (or type) work. Research / summary / file-write jobs run in a background queue. When a job lands, the agent **barges in and speaks the result first**. A side Activity timeline shows the queue.

## Run

```bash
cd apps/dots-voice-agent
bun install
bun run dev
```

Open http://localhost:5173

No `OPENAI_API_KEY` is required. The default path is a full **simulated** voice + task loop (type-to-speak, sample chips, `speechSynthesis` barge-in, mocked executors). That is the path used to validate this demo.

## Optional Realtime

Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Vite mints an ephemeral client secret (`POST /v1/realtime/client_secrets`) and the browser opens a WebRTC call (`POST /v1/realtime/calls`). The key never ships to the client.

```bash
cp .env.example .env
```

| Var | Default | Role |
| --- | --- | --- |
| `OPENAI_API_KEY` | unset → mock | Server-only. Enables the live Realtime call. |
| `OPENAI_REALTIME_MODEL` | `gpt-realtime` | Realtime session model |
| `OPENAI_REALTIME_VOICE` | `marin` | Output voice |

## What it does

1. **Start call** stays on the line. You do not hang up to assign more work.
2. Speak or type a task, or click Research / Summarize / Write file.
3. The agent confirms, then the job appears in the right-rail queue.
4. You can queue another task while the first is still running.
5. When a job finishes, the agent interrupts and speaks the result first.

Background tools are mocks: timed, structured results. Enough to prove the interrupt-and-speak-first loop.

## Scripts

```bash
bun run dev        # Vite on :5173, /api/config + /api/realtime/client-secret
bun run typecheck
bun run build
```
