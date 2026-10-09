# OpenShell policy playground

Single-user mock of [NVIDIA OpenShell](https://docs.nvidia.com/openshell/reference/policy-schema) — the policy + gateway half of the [Open Agent Safety Platform](https://x.com/JensenHuang/status/2104499465055023424).

Edit a YAML sandbox policy, fire mock agent actions (file / network / MCP / credentials) at a local gateway, and watch allow / deny land in a live audit log.

**Not a Docker sandbox.** No Landlock, no real proxy, no keys.

```bash
bun install
bun run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

## What it evaluates

| Action | Policy surface |
| --- | --- |
| File read/write | `filesystem_policy.read_only` / `read_write` / `include_workdir` |
| Network | `network_policies` host+port+binary, REST `access` / `rules` / `deny_rules`, `enforcement: audit` |
| MCP | `protocol: mcp` method + `tool`, deny_rules first |
| Credentials | `credential_binding.provider` vs attached mock providers (`github`, `work-gcp`) |

`POST /api/gateway` is a Vite middleware (the “gateway”). Actions use the last **Apply policy** snapshot, not the dirty editor buffer — same idea as `openshell policy set` for dynamic sections.

## Scripts

```bash
bun test
bun run typecheck
bun run build
```
