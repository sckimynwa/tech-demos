# cerebras-fast-agent

Single-user playground for [Cerebras Inference](https://inference-docs.cerebras.ai/) speed: OpenAI-compatible streaming chat with a live tok/s meter, plus a restaurant-booking agent that races **sequential vs parallel** tool-call timelines.

Source: https://x.com/cerebras/status/2103506859709858175

## Run

```bash
cd apps/cerebras-fast-agent
bun install
bun run dev
```

Open http://127.0.0.1:5173

- Vite UI: `5173` (proxies `/api` → Bun)
- Bun API: `8787`

## Modes

| `CEREBRAS_API_KEY` | Behavior |
| --- | --- |
| unset | **Mock / simulated latency.** Deterministic token stream + restaurant catalog with paced tool waits. |
| set | **Live.** Server calls `https://api.cerebras.ai/v1/chat/completions`. Key never reaches the browser. |

Copy `.env.example` → `.env` if you have a key:

```bash
cp .env.example .env
```

Optional: `CEREBRAS_MODEL` (default `gpt-oss-120b`), `CEREBRAS_BASE_URL`, `PORT`.

## Surfaces

1. **Speed chat** — SSE stream, TTFT, token count, live tok/s needle.
2. **Booking race** — same “Saturday dinner for 4 in SoMa, Italian” brief. Sequential pays an LLM+API hop per lookup; parallel fans out availability + menus, then books. Gantt shares a time axis.

Restaurant APIs are in-process mocks (search / availability / menu / book) so the timeline demo works offline.

## Layout

```
server/     Bun API: /api/health /api/chat /api/booking
src/features/chat
src/features/booking
src/shared  event protocol + SSE client
```
