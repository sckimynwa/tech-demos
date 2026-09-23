# PLAN — apps/stagehand-v4

## Goal
Single-user playground that runs **Stagehand v4** against one public URL and shows extracted text/links in a minimal UI.

## Single-user MVP
- In: URL field, optional natural-language extract instruction, Run button, result panel (text + link list), status/errors, README with `bun install && bun run dev`
- Out: auth, multi-user, scheduled jobs, Browserbase cloud account required for MVP (prefer local browser), production deploy, Jev integration

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React (or Next if Stagehand docs recommend) under `apps/stagehand-v4/` with root-style `bunfig.toml` (`minimumReleaseAge = 259200`).
2. Add Stagehand v4 dependency; wire a server-side (or Node) run endpoint that launches Stagehand against the given URL with the instruction and returns structured `{ text, links[], rawNotes? }`.
3. Minimal shadcn/ui UI: form + results; loading and error states.
4. Smoke path documented; attach screenshot + short video of a successful run in the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen UI without heavy framework wiring
- **shadcn/ui** — minimalist form/button/card
- **Stagehand v4** (`@browserbasehq/stagehand` or current v4 package) — browser extract engine; local Chromium preferred for MVP
- **Fable 5 cloud agent** — implementer

## Deferred
- Browserbase cloud credentials / hosted sessions
- Jev / Kev decision-layer pairing
- Cloudflare Pages path deploy
- Multi-step agent workflows

## Success
- `cd apps/stagehand-v4 && bun install && bun run dev` works
- One PR only touches `apps/stagehand-v4/`
- PR includes ≥1 screenshot and ≥1 video of the running app extracting from a public page
