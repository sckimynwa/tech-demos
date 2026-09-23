# AGENTS.md — tech-demos

Sticky Bun monorepo for small, single-user tech demos discovered from X bookmarks.

## Rules

- **Runtime:** Bun for install, scripts, and running apps.
- **Scope:** Cloud agents may only add or update `apps/<kebab-slug>/` for one demo per run. Do not create a new GitHub repository.
- **Self-contained apps:** From `apps/<slug>/`, `bun install && bun run dev` must work.
- **Plan first:** Use `skills/project-planning/` and write `apps/<slug>/PLAN.md` before implementing.
- **Validation:** Every demo PR must attach **at least one screenshot and at least one video** of the running app.
- **Model:** Prefer `claude-fable-5` (Fable 5) for prototype cloud agents unless the owner overrides.
- **Tracking:** Read/update `tracking/seen-bookmarks.json` (`proposed` / `built` / `skipped`); never re-propose a listed URL.

## Layout

```
AGENTS.md
bunfig.toml
package.json
skills/project-planning/
apps/<slug>/          # one demo per pick
tracking/seen-bookmarks.json
```

## Cloudflare (later)

One Cloudflare Pages project for the whole monorepo (path per `apps/<slug>/`), not one project per app. Needs repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
