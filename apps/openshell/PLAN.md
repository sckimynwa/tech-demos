# PLAN — apps/openshell

## Goal
Single-user **OpenShell-style policy playground**: edit a YAML sandbox policy, fire mock agent actions through a local gateway, and watch allow/deny land in a live audit log.

Source: [NVIDIA Open Agent Safety Platform](https://x.com/JensenHuang/status/2104499465055023424) (OpenShell + Sentry). Policy shape follows the public [OpenShell policy schema](https://docs.nvidia.com/openshell/reference/policy-schema).

## Single-user MVP
- In: YAML policy editor with a realistic default policy; mock file / network / MCP / credential actions that POST to a local gateway; allow/deny verdict + reason; live audit log; README with `bun install && bun run dev`; no API keys
- Out: real Docker/Landlock sandbox, real network proxy, real MCP servers, auth/multi-user, Cloudflare deploy, Sentry integration

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/openshell/` with app-local `bunfig.toml` (`minimumReleaseAge = 259200`) and a minimalist shadcn/ui shell.
2. Policy + gateway: parse YAML (`version`, `filesystem_policy`, `network_policies` with REST/MCP endpoints, `credential_binding`); evaluate mock actions; Vite middleware `POST /api/gateway` returns `{ verdict, reason, layer, matchedRule }`.
3. Playground UI: editor (parse errors, Apply), preset + custom actions, last verdict, live audit stream. Presets cover allow and deny for each action kind.
4. Critical-path tests for the evaluator; smoke `bun install && bun run dev`; PR attaches ≥1 screenshot and ≥1 video.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen playground without framework-grade routing
- **shadcn/ui + Tailwind** — minimalist editor / button / card / badge
- **yaml** — parse policy documents
- **In-process gateway (Vite middleware)** — mock OpenShell control plane; no Docker

## Deferred
- Kernel Landlock / process identity enforcement
- Full L7 proxy (WebSocket, GraphQL, SigV4 signing, credential rewrite of live traffic)
- Real MCP Streamable HTTP servers and provider credential vaults
- Sentry pairing from the Open Agent Safety Platform announcement
- Cloudflare Pages path deploy

## Success
- `cd apps/openshell && bun install && bun run dev` works with no keys
- One PR only touches `apps/openshell/`
- PR includes ≥1 screenshot and ≥1 video of allow + deny decisions in the audit log
