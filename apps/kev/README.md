# Kev — System One ticket-routing playground

Single-user playground for [Kev](https://github.com/jaredpalmer/kev) (Jared Palmer): open-source Jev-like decision models on Qwen3.5 (0.8B / 4B / 9B) and Qwen3.8-27B.

Edit a support ticket (`state`) and typed `noul` / `choice` / `score` questions, hit **Run**, and get calibrated probability bars, confidence, and latency. The UI talks to a tiny Bun proxy that either mocks `POST /v1/systemone` or forwards to a real `kev.serve` / Modal endpoint. `KEV_API_KEY` stays on the server.

## Run

```bash
cd apps/kev
bun install
bun run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). No env vars → **mock mode** (deterministic sample answers in the exact Kev wire shape, ~300–600 ms). `?mock=1` forces mock even when a live URL is set.

```bash
bun test          # confidence math + probability normalization only
```

## Env

| Key | Required | Meaning |
|---|---|---|
| `KEV_BASE_URL` | no | `http://127.0.0.1:8009` (local `kev.serve`) or `https://<ws>--kev-api.modal.run` (Modal). Unset → mock. |
| `KEV_API_KEY` | no | `Authorization: Bearer <key>` on the live POST. Server-side only. |
| `KEV_MODEL` | no | Default model name. `kev-latest`. |
| `PORT` | no | Bun API port. Default `8787`. Vite proxies `/api`. |

Copy `.env.example` → `.env` for live mode. `.env` is gitignored.

## Live Kev

**Local** ([Kev README](https://github.com/jaredpalmer/kev#run-it-locally)):

```bash
git clone https://github.com/jaredpalmer/kev.git && cd kev
uv sync --extra serve
uv run --extra serve python -m kev.serve --run jaredpalmer/kev-4b --port 8009
```

Then in this app:

```bash
KEV_BASE_URL=http://127.0.0.1:8009 bun run dev
```

**Modal** — scale-to-zero HTTPS. First request after idle is ~35 s (the UI shows a cold-start hint after 5 s).

```bash
KEV_BASE_URL=https://<workspace>--kev-api.modal.run KEV_API_KEY=<key> bun run dev
```

**Hugging Face Space** — try Kev-4B / 0.8B in the browser with no install: [huggingface.co/spaces/jaredpalmer/kev](https://huggingface.co/spaces/jaredpalmer/kev). That Space is not this playground's backend; point `KEV_BASE_URL` at `kev.serve` or Modal for live mode here.

## API proxy

| Method | Path | Role |
|---|---|---|
| `GET` | `/api/config` | `{ mode, model, baseUrlHost }` — host only, never the key |
| `POST` | `/api/systemone` | Mock or `POST {KEV_BASE_URL}/v1/systemone`. Passes through status, body, `x-typesafe-request-id`. `?mock=1` forces mock. |

## Wire shape

Same contract as TypeSafe System One / `kev.serve`. See `PLAN.md` for the README example request/response. Confidence (mock):

- choice: `(p_max − 1/K) / (1 − 1/K)` (`K=1` → `1`)
- score: `max(0, 1 − E|level − mode| / D)` with `D` the mean distance of a uniform over the levels from its middle (`2/3` for 3 levels)
