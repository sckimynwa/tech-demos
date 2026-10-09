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

## Implementation notes (as built)
- Package: `@browserbasehq/stagehand@^4.1.0`. The v4 API is `localBrowser.launch()` → `Stagehand.create({ browser, model? })` → `browser.context.pages()`.
- Branded Google Chrome rejects CDP `Extensions.loadUnpacked`, which v4 needs. The API auto-downloads **Chrome for Testing** via `@puppeteer/browsers` into `.browsers/`; `CHROME_PATH` overrides it.
- No-key happy path: `page.evaluate` for text and links, plus `page.snapshot()` for the accessibility tree. `stagehand.extract(instruction)` runs only when an OpenAI, Anthropic, or Google key is set. Otherwise the UI shows a "skipped" notice.
- Layout: `server/` (Bun.serve on 3001; `chrome.ts`, `model.ts`, `extract.ts`) and `src/domains/extract/` (React Query hooks and components). Vite proxies `/api`, and `bun run dev` runs both with `concurrently`.

## Deferred
- Browserbase cloud credentials / hosted sessions
- Jev / Kev decision-layer pairing
- Cloudflare Pages path deploy
- Multi-step agent workflows

## Success
- `cd apps/stagehand-v4 && bun install && bun run dev` works
- One PR only touches `apps/stagehand-v4/`
- PR includes ≥1 screenshot and ≥1 video of the running app extracting from a public page
