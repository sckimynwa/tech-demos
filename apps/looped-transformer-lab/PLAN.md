# PLAN — apps/looped-transformer-lab

## Goal
Single-user in-browser lab that shows how a tiny looped transformer reuses one block across 1–8 iterations to trade compute for accuracy on addition and maze reasoning, versus a same-parameter-count plain transformer.

## Single-user MVP
- In: loop-count slider (1–8); 3-digit addition + 5×5 maze tasks; per-loop prediction evolution; accuracy / latency / FLOPs; side-by-side looped vs plain (same unique params, one pass); `bun install && bun run dev`
- Out: CUDA / server training, Hugging Face / API keys, multi-user, real GPT-scale weights, Cloudflare deploy, maze editor, learned attention training from scratch in the UI

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/looped-transformer-lab/` with `bunfig.toml` (`minimumReleaseAge = 259200`) before install; pull a minimal shadcn/ui set.
2. Ship a tiny in-browser TS transformer (one shared block) plus addition and maze programs so extra loops visibly refine carries / path — not a black-box mock score.
3. Lab UI: task + problem controls, loop slider, looped-vs-plain panes, per-loop token/grid evolution, metric cards, accuracy-vs-loops sweep.
4. Critical-logic tests (carry chain, maze horizon, flop scaling); smoke `bun run dev`; attach screenshot + video on the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen playground, no server or API keys
- **TypeScript transformer kernel** — real matmul attention/FFN in-browser so latency and FLOPs scale with loops; no CUDA
- **shadcn/ui (minimalist)** — slider, cards, tabs, badges without a custom design system
- **bun:test** — carry / horizon / compute assertions only

## Deferred
- Live SGD training in the UI (too slow / unstable for a 1-screen MVP; structured recurrent-depth programs already show the real loop-vs-depth curve)
- WebGPU kernels (JS matmul is enough at this size)
- Hugging Face / GPT-6.1 Sol weight loading
- Cloudflare Pages path deploy

## Success
- `cd apps/looped-transformer-lab && bun install && bun run dev` works
- One PR only touches `apps/looped-transformer-lab/`
- PR includes ≥1 screenshot and ≥1 video of loop count changing accuracy, latency, compute, and per-loop predictions
