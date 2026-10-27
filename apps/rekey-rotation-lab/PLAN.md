# PLAN — apps/rekey-rotation-lab

## Goal

Single-user offline playground that shows how [golbin/rekey](https://github.com/golbin/rekey) reissues one API key and propagates it through every template target, including a failed Vercel redeploy and an undo.

## Single-user MVP

- In:
  - Mock OpenAI-style issuer, mock 1Password item (`Acme - Prod` / `shop.openai`), mock `.env`, Vercel production env, Supabase Edge secret, and GitHub Actions secret.
  - Dependency graph of `{{ op://… }}` references. Nodes highlight in rekey's real order: preflight → issue → save vault (old value kept) → write targets sorted by template path → optional redeploy → revoke withheld.
  - Timeline with per-target diffs (masked old → masked new), redeploy logs, and status.
  - Failure injection: forward Vercel production redeploy returns `ERROR`. Writes that already landed stay landed. Revoke is not run while problems remain. Undo writes the previous value back, redeploys, then deletes the new issuer key.
  - Obviously fake secrets, masked in the UI (`sk-proj-FAKE…wxyz`).
  - Real `rekey` CLI only behind `REKEY_REAL=1` plus an off-by-default switch, and only as `rotate --dry-run --no-input` against a temp file store.
  - README with `bun install && bun run dev`.
- Out: live 1Password, live provider APIs, non-dry-run CLI, Railway/Fly/GCP/Workers targets, multi-key batch rotate, auth, deploy.

## Tasks (vertical slices)

1. Scaffold Vite + React + TS from `create-vite` under `apps/rekey-rotation-lab/` with `bunfig.toml` (`minimumReleaseAge = 259200`) before `bun install`. shadcn/ui, minimalist preset.
2. Pure rotation engine that mirrors rekey `rotate` / `sync` / `offer_deploy` / `undo` (order, partial failure, revoke gate, undo swap). Tests for that logic only.
3. Graph, timeline, diffs, failure toggle, undo playback. Masked fake keys.
4. Opt-in dry-run bridge, off unless `REKEY_REAL=1`.
5. `bun run test`, `bun run lint`, `bun run build`. Screenshot and short video of one failure plus rollback.

## Stack

- **Bun** — runtime, install, scripts, tests (repo default).
- **Vite + React + TypeScript** — one-screen lab; no server framework for the mock path.
- **shadcn/ui (radix, base-nova)** — buttons, cards, switches, and the trace/timeline chrome.
- **In-browser engine** — rekey's Python CLI talks to real CLIs and 1Password; the default demo must not.
- **Optional Python `rekey` dry-run** — same concepts, gated, temp `REKEY_STORE=file:`.

## Deferred

- Calling `rekey rotate` without `--dry-run` (would issue and write real targets).
- Railway, Fly, Workers, GCP kinds (same write-then-maybe-redeploy model; four targets already show the split).
- Browser-issued keys and database-password ordering beyond a note in the summary (OpenAI is the automatic path).
- Git hooks. Test script covers the engine; formatting hooks are not on the MVP path.
- Cloudflare Pages.

## Success

- `cd apps/rekey-rotation-lab && bun install && bun run dev` works, and `bun run build` / lint / test pass.
- PR touches only `apps/rekey-rotation-lab/`.
- PR includes at least one screenshot and one video of a full mock rotation with a Vercel redeploy failure and undo.
