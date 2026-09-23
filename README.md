# tech-demos

Sticky Bun monorepo for weekday X-bookmark tech demos.  
X 북마크에서 고른 기술을 `apps/<slug>/` 데모로 쌓는 고정 모노레포.

## Layout

| Path | Role |
|------|------|
| `AGENTS.md` | Rules for cloud agents |
| `skills/project-planning/` | MVP planning skill (vendored) |
| `apps/<slug>/` | One self-contained demo per pick |
| `tracking/seen-bookmarks.json` | Proposed / built / skipped bookmarks |
| `bunfig.toml` | Bun install delay (`minimumReleaseAge`) |

## Flow

1. **Scout** — weekday routine picks one bookmarked tech and asks for approval.
2. **Plan** — after Approve/Tweak, write `apps/<slug>/PLAN.md` via project-planning.
3. **Build** — Cursor cloud agent (Fable 5) opens one PR under `apps/<slug>/` only.
4. **Validate** — PR must include ≥1 screenshot **and** ≥1 video of the running app.

```bash
cd apps/<slug>
bun install
bun run dev
```

## Cloudflare (optional, later)

One Pages project for the whole repo (path per app), not one project per app.  
Requires GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
