# PLAN — apps/kev

## Goal
Single-user **System One ticket-routing playground** for [Kev](https://github.com/jaredpalmer/kev) (Jared Palmer's open-source, Jev-like decision models on Qwen3.5: Kev-0.8B / 4B / 9B, plus 27B): edit a ticket `state` and typed `noul` / `choice` / `score` questions, hit Run, and see calibrated probability bars, confidence and latency.

Source bookmark: https://x.com/Dontgiveup_26/status/2102542145924321295

## Single-user MVP
- **In**
  - Ticket **state** editor (textarea) with 3–4 preset tickets (e.g. "charged twice", "late + wrong size + double charge", "password reset", "angry refund").
  - **Question builder**: add / remove / edit questions; each has an id, a type (`noul` | `choice` | `score`), instructions, and criteria
    (`noul`: optional `true`/`false` descriptions; `choice`: option name → description|null; `score`: ordered level list, low → high).
    Default set = README example: `department` (choice: returns / shipping / billing), `escalate` (noul), `frustration` (score: Calm / Frustrated / Very angry).
  - **Run** → `POST {KEV_BASE_URL}/v1/systemone` with `{ state, model, questions }` via a tiny Bun server proxy (keeps `KEV_API_KEY` server-side, avoids CORS).
  - **Results** per question:
    - `noul`: one yes-probability bar (+ "route automatically" vs "send to human" hint from a threshold slider, default 0.8).
    - `choice`: bar per option, highlighted winner, `confidence` badge.
    - `score`: bar per level using `legend`, expected `score` (mean level index) marker, `confidence` badge.
  - Header strip: mode badge (**Live** / **Mock**), model, `latency_ms` (server) + round-trip ms (client), `usage.input_tokens` / `output_tokens`, `x-typesafe-request-id` if present.
  - Collapsible **Wire format** panel: exact request JSON + raw response JSON (copy button).
  - Model selector: `kev-latest` (default) + free-text override (e.g. a Modal deployment's model name).
  - **Mock mode** when `KEV_BASE_URL` is unset (or `?mock=1`): server returns deterministic sample responses in the exact wire shape (keyword heuristics over state + seeded pseudo-random, normalized probabilities, confidence computed with Kev's formulas), with a simulated latency (~300–600 ms). UI shows a clear "Mock — set KEV_BASE_URL for real Kev" banner.
  - Error states: unreachable server, 401 (bad key), 422 (validation / state too long — show server message), Modal cold start (~35 s; show spinner + hint after 5 s).
  - README: what Kev is, how to run locally / Modal / HF Space, env keys, `bun install && bun run dev`.
- **Out**
  - Running the model in-process / Python / GPU setup inside this app
  - Auth, multi-user, persistence beyond `localStorage` of the last state+questions
  - Fine-tuning, `/permute` and `/separate` endpoints, batch CSV routing
  - Production deploy (Cloudflare Pages comes later, monorepo-wide)

## Wire format (contract to implement against)
Request:
```json
{ "state": "…", "model": "kev-latest",
  "questions": {
    "department": { "type": "choice", "instructions": "Which team should handle this?",
                    "criteria": { "returns": "Exchanges, refunds, wrong or damaged items",
                                  "shipping": "Delivery status, delays, lost packages",
                                  "billing": "Charges, invoices, payment problems" } },
    "escalate":   { "type": "noul", "instructions": "Does this need urgent human attention?" },
    "frustration":{ "type": "score", "instructions": "How frustrated is the customer?",
                    "criteria": ["Calm", "Frustrated", "Very angry"] } } }
```
Response:
```json
{ "model": "kev-latest",
  "answers": {
    "department":  { "type": "choice", "choice": "returns", "confidence": 0.21,
                     "probabilities": { "returns": 0.47, "shipping": 0.28, "billing": 0.25 } },
    "escalate":    { "type": "noul", "noul": 0.93 },
    "frustration": { "type": "score", "score": 1.44, "confidence": 0.34,
                     "legend": { "0": "Calm", "1": "Frustrated", "2": "Very angry" },
                     "probabilities": { "0": 0.00, "1": 0.56, "2": 0.44 } } },
  "usage": { "input_tokens": 101, "output_tokens": 161 },
  "latency_ms": 495 }
```
Confidence formulas (for mock): choice `(p_max − 1/K)/(1 − 1/K)` (K=1 → 1); score `max(0, 1 − E|level − mode| / D)` where D = mean distance of a uniform distribution over levels from its middle (2/3 for 3 levels).

## Env
| Key | Required | Meaning |
|---|---|---|
| `KEV_BASE_URL` | no | e.g. `http://127.0.0.1:8009` (local `kev.serve`), `https://<ws>--kev-api.modal.run` (Modal). Unset → mock mode |
| `KEV_API_KEY` | no | Sent as `Authorization: Bearer <key>` (Modal / servers started with `KEV_API_KEY`) |
| `KEV_MODEL` | no | Default model name, `kev-latest` |
| `PORT` | no | Bun API port (default 8787; Vite proxies `/api`) |

`.env.example` committed; `.env` git-ignored.

## Tasks (vertical slices)
1. **Scaffold** — `apps/kev/bunfig.toml` with `[install] minimumReleaseAge = 259200` first; then `bunx create-vite@latest . --template react-ts` (no install), `bun install`; Tailwind + `bunx shadcn@latest init` (minimal/neutral preset); pull `button card textarea input select badge tabs slider tooltip collapsible` on demand.
2. **Typed contract + mock** — `src/shared/systemone.ts` (TS types for request/response/questions) and `server/mock.ts` (deterministic sample answers + confidence formulas). Unit tests (`bun test`) for confidence math and probability normalization only.
3. **Bun API server** — `server/index.ts` with `Bun.serve`: `POST /api/systemone` (forward to `KEV_BASE_URL` or mock; measure round-trip; pass through status + body + request-id), `GET /api/config` (mode, model, base URL host only — never the key). `bun run dev` runs server + Vite concurrently (e.g. `concurrently` or two `Bun.spawn`s in a `dev.ts`).
4. **Editor UI** — state editor + presets, question builder with per-type criteria editors, model field, Run button (⌘/Ctrl+Enter).
5. **Results UI** — probability bars per type, confidence badges, latency/usage strip, threshold slider, wire-format panel, mode banner, error/cold-start states.
6. **Docs + evidence** — README (run, env, local/Modal/HF pointers). Run the app in mock mode (and live if any endpoint is reachable), capture **≥1 screenshot and ≥1 short video** (e.g. Playwright `recordVideo` or screen capture → mp4/webm/gif) of editing a ticket and seeing bars update; attach both to the PR.

## Layout
```
apps/kev/
  PLAN.md  README.md  bunfig.toml  package.json  .env.example
  server/  index.ts  mock.ts  kev-client.ts
  src/
    shared/systemone.ts
    features/editor/   (StateEditor, QuestionBuilder, presets.ts)
    features/results/  (ResultCard, ProbBar, MetaStrip, WirePanel)
    components/ui/     (shadcn)
    App.tsx  main.tsx
  tests/ systemone.test.ts
```

## Stack
- **Bun** — runtime, package manager, API server (`Bun.serve`), test runner (repo default)
- **Vite + React + TS** — one-screen UI; matches the Stagehand demo; no framework routing needed
- **shadcn/ui + Tailwind** — minimalist cards/forms; bars are plain divs (no chart lib needed)
- **No Kev SDK** — the API is one JSON POST; a typed `fetch` wrapper is simpler than adding the Python-first TypeSafe SDK
- **Opus 5.5 (`claude-opus-5-5`) cloud agent** — implementer (owner override of Fable 5 default)

## Deferred
- `/v1/systemone/permute` (option-order sensitivity) visualizer — nice follow-up, not MVP
- Batch routing of a CSV of tickets
- Side-by-side Kev-0.8B vs 4B vs 9B comparison (needs multiple endpoints)
- Jev (TypeSafe hosted) A/B
- Cloudflare Pages deploy

## Success
- `cd apps/kev && bun install && bun run dev` works with **no env** (mock mode) and with `KEV_BASE_URL` set (live)
- PR touches only `apps/kev/`
- PR includes ≥1 screenshot and ≥1 video of the running app
