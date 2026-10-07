# Looped Transformer Lab

In-browser playground for **looped transformers / recurrent depth**: one shared block, reused for 1–8 inference loops. Same unique parameters as a plain one-pass transformer; extra loops buy sequential compute (carry hops, BFS layers).

Surfaced from the GPT-6.1 Sol “two-pass” leak — this lab is a tiny, local demo of that idea. No API keys.

## Run

```bash
cd apps/looped-transformer-lab
bun install
bun run dev
```

Opens at `http://localhost:5173`.

```bash
bun test
bun run typecheck
```

## What it shows

- **3-digit addition** — each loop consumes the previous place’s carry. `999+1` needs 4 loops.
- **5×5 maze** — each loop expands one BFS hop. Distance *d* needs *d* loops.
- Slider **1–8**: accuracy, measured shared-block latency, and FLOPs vs a **same-parameter** plain model (L=1).
- Per-loop digit / grid evolution so you can watch the prediction change.

The predictions are a structured recurrent-depth program sitting on a real TS attention+FFN kernel (matmul, RMSNorm, residuals). Unique weights stay constant; compute scales with L.
