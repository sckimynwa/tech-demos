# PLAN — apps/cerebras-fast-agent

Source: https://x.com/cerebras/status/2103506859709858175  
(Cerebras “20x faster Grok bot” / Pi harness — inference speed + agent tool loops)

## Goal
Single-user playground that makes Cerebras inference *feel* fast: OpenAI-compatible streaming chat with a live tok/s meter, plus a restaurant-booking agent that compares sequential vs parallel tool-call timelines.

## Single-user MVP
- In
  - Streaming chat against Cerebras OpenAI-compatible API (`https://api.cerebras.ai/v1`)
  - Live tokens/sec meter (wall-clock from first token; update on each SSE chunk)
  - Restaurant-booking scenario: search / availability / menu / book tools
  - Side-by-side sequential vs parallel tool-call Gantt timelines + total latency
  - `CEREBRAS_API_KEY` stays server-side only
  - Mock/simulated latency mode when the key is unset (deterministic restaurant data + paced token stream)
  - README + `.env.example`; `bun install && bun run dev` from this folder
- Out
  - Real restaurant / calendar / payment APIs
  - Multi-user, auth, persisted threads
  - Pi harness / Grok bot clone
  - Cloudflare Pages deploy
  - Multi-provider bakeoff beyond Cerebras + mock

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/cerebras-fast-agent/` from `bunx create-vite` (skip install). Add `bunfig.toml` with `[install] minimumReleaseAge = 259200`, then `bun install`. Init shadcn/ui (minimalist).
2. Bun API process (Vite proxy): `POST /api/chat` streams completions; `POST /api/booking` runs the tool loop with `parallel_tool_calls` on/off. Key never leaves the server. If unset, serve mock SSE + simulated tool latency.
3. Speed Chat screen: composer, streamed assistant text, live tok/s + TTFT + token count, mock-mode badge.
4. Booking Playground: preset “Saturday dinner for 4 in SoMa, Italian”; Sequential / Parallel run; live Gantt of tool spans; transcript + confirmation card.
5. Smoke path in README; attach ≥1 screenshot and ≥1 video of both surfaces in the PR.

## Stack
- **Bun** — runtime, install, scripts (repo default)
- **Vite + React** — two-panel playground without a heavy app framework
- **shadcn/ui + Tailwind** — cards, tabs, buttons, badges
- **OpenAI-compatible `fetch` to Cerebras** — `baseURL https://api.cerebras.ai/v1`, model `gpt-oss-120b` (fallback `llama-3.3-70b`); no extra vendor SDK required
- **SSE / NDJSON over the Bun server** — stream tokens and tool-span events to the UI
- **In-process mock tools** — restaurant catalog + `setTimeout` latencies so the timeline demo works offline

## File layout
```
apps/cerebras-fast-agent/
  PLAN.md
  README.md
  .env.example
  bunfig.toml
  package.json
  server/           # Bun HTTP: chat stream + booking loop + mock
  src/
    features/chat/      # speed chat + tok/s meter
    features/booking/   # scenario + timeline
    shared/             # types, SSE client
```

## Deferred
- Real OpenTable-style APIs and hold/book mutations
- Pi / coding-agent harness from the source post
- Cloudflare Pages path deploy
- Fine-grained tokenizers (MVP counts streamed pieces / usage when the API sends it)

## Success
- `cd apps/cerebras-fast-agent && bun install && bun run dev` works with or without `CEREBRAS_API_KEY`
- One PR only touches `apps/cerebras-fast-agent/`
- PR includes ≥1 screenshot and ≥1 video of streaming tok/s **and** the sequential vs parallel booking timeline
