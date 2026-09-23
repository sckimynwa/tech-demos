# Stagehand v4 extract playground

Single-user playground: paste a public URL, hit **Run**, and a Bun API drives [Stagehand v4](https://docs.stagehand.dev/v4/first-steps/quickstart) (`@browserbasehq/stagehand@^4.1.0`) in a **local headless Chrome** to return page text, links, and Stagehand's accessibility snapshot. An optional natural-language instruction runs `stagehand.extract(instruction)` when an LLM key is set.

```bash
cd apps/stagehand-v4 && bun install && bun run dev
```

Open http://localhost:5173. The first API boot downloads Chrome for Testing (~170 MB) into `.browsers/`; later runs reuse it.

## How it works

```
Vite + React (5173) ──/api proxy──▶ Bun.serve (3001) ──▶ localBrowser.launch() + Stagehand.create()
                                                          ├─ page.goto(url)
                                                          ├─ page.evaluate() → innerText + <a href> list
                                                          ├─ page.snapshot() → accessibility tree
                                                          └─ stagehand.extract(instruction)  (only with a model key)
```

- `server/chrome.ts` resolves the browser. Stagehand v4 injects its runtime through CDP `Extensions.loadUnpacked`, which **branded Google Chrome rejects** ("Method not available"). The server therefore downloads Chrome for Testing via `@puppeteer/browsers` unless `CHROME_PATH` is set.
- `server/extract.ts` launches one browser per run, then closes it. Text is capped at 20k chars and links at 200 (deduped, http(s) only).
- `src/domains/extract/` contains the UI: form, result panel (loading / error / success), link list, and LLM notice.

## Optional env

| Var | Effect |
| --- | --- |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | Enables `stagehand.extract(instruction)`. Default models: `openai/gpt-5.4-mini`, `anthropic/claude-haiku-4-5`, `google/gemini-2.5-flash` |
| `STAGEHAND_MODEL` (+ `STAGEHAND_MODEL_API_KEY`) | Overrides the model, e.g. `anthropic/claude-sonnet-4-6` |
| `CHROME_PATH` | Uses an existing Chromium or Chrome for Testing binary and skips the download. It must support `Extensions.loadUnpacked`. |
| `API_PORT` | API port (default `3001`) |

Without a key, the instruction is skipped and the UI says so. Text, links, and the accessibility tree still work. No Browserbase account is needed; `BROWSERBASE_API_KEY` is not used.

## Scripts

`bun run dev` starts the API and the web app. The other scripts are `dev:api`, `dev:web`, `typecheck`, `build`, and `lint`.
