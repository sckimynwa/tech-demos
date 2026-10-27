# rekey rotation lab

Offline playground for [golbin/rekey](https://github.com/golbin/rekey) (MIT). One command’s worth of key rotation, drawn as a graph: issue a key, keep the old value in 1Password, write every template target, redeploy what actually redeploys, and undo if that redeploy fails.

The default UI is entirely fake. It does not read or write OpenAI, 1Password, Vercel, Supabase, or GitHub.

## Run

```bash
cd apps/rekey-rotation-lab
bun install
bun run dev
```

Then open the printed local URL.

- **Rotate** plays `rekey rotate shop.openai`: preflight, issue, vault save, then writes in template-path order (`.env.local` → GitHub Actions → Supabase → Vercel production).
- **Fail the forward Vercel redeploy** injects `readyState ERROR` after the env var is already updated. The running deployment keeps the old value. Revoke is not asked. **Undo** writes the previous value back, redeploys, and deletes the new issuer key.
- Secrets on screen are masked (`sk-proj-FAKE…wxyz`). The full strings are obvious fakes and never leave the browser on this path.

```bash
bun run test
bun run lint
bun run typecheck
bun run build
```

## Real CLI (opt-in, dry-run only)

Leave this off. The lab does not shell out unless both are true:

1. Dev server started with `REKEY_REAL=1 bun run dev`
2. The **Opt into the real CLI dry-run** switch is on, and you press **Run dry-run**

That runs a fixed command only:

```bash
rekey --no-input rotate shop.openai --dry-run
```

against a temp copy of `fixtures/rekey-home` and `REKEY_STORE=file:…`. `--dry-run` does not issue a key and does not call provider CLIs. Without `REKEY_REAL=1` the endpoint returns 403.

## What is real vs mocked

| Piece | Default demo |
| --- | --- |
| Rotation order, vault previous/revoke, partial write failure, Vercel-only redeploy, undo | Modeled in `src/domain/engine.ts` from upstream `rekey_lib` |
| OpenAI, 1Password, `.env`, Vercel, Supabase, GitHub | Mock state in the browser |
| `rekey` Python CLI | Not invoked unless `REKEY_REAL=1` and the switch is on, and then only `--dry-run` |
