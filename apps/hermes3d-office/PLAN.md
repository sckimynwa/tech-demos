# PLAN — apps/hermes3d-office

## Goal
Single-user retro 3D office that shows a 13-agent example org as characters who move in real time from a mock event stream.

## Single-user MVP
- In: walkable/orbit 3D office; agents placed by team (1HQ Product, Growth, AX, Global, Corp); mock event stream drives `idle | working | reviewing | done` and walks them between desk / meeting / review; click agent → side panel with recent mock task log; documented JSON/WebSocket ingest hook (mock default); `bun install && bun run dev` from this folder; no API keys
- Out: Hermes gateway / Studio / Tailscale; Phaser 2D office; gym / QA / janitor / Spotify / GitHub / voice; multi-user or remote second office; real agent backends

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React + TypeScript under `apps/hermes3d-office/` with `bunfig.toml` (`minimumReleaseAge = 259200`) before install.
2. Build a compact retro office (team desk clusters, meeting table, review bay) in React Three Fiber — same spatial idea as Hermes3D, not a vendored Studio clone.
3. Roster the 13 display-name agents by team; derive destination from event state; lerp/walk them live.
4. Click-to-inspect side panel + live event ticker; expose `window.Hermes3DOffice.ingest` and optional `?events=ws://…` hook (documented, mock default).
5. README + MIT attribution; PR with screenshot and video of the running office.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React + TypeScript** — one-screen 3D demo; Hermes3D’s Next.js Studio + custom Node gateway cannot run self-contained from this folder (`npm run demo-gateway` + `npm run dev`, App Router, `~/.hermes` settings)
- **three + @react-three/fiber + @react-three/drei** — same 3D stack Hermes3D uses for `/office`
- **Custom HUD chrome** — overlay on a full-viewport canvas; shadcn form kit would fight the scene
- **Fable 5 cloud agent** — implementer

## Reuse vs reimplementation
- **Reused (idea / contract, not source):** Hermes3D’s derived-state office — events → agent holds → destinations (desk / standup-style meeting / GitHub-style review). MIT notice + LICENSE copy included. Display names only.
- **Not vendored:** `RetroOffice3D.tsx` (~300KB), Studio WS proxy, demo gateway, Phaser builder, multi-agent beta second office, gym/QA/janitor/Spotify.
- **Reimplemented:** minimal R3F office, low-poly agents, mock stream, inspect panel, optional ingest hook.

## Deferred
- Real Hermes / custom runtime gateway
- Pathfinding nav grid, conversation huddles, speech bubbles
- Office builder / 2D pixel renderer
- Cloudflare Pages path deploy

## Success
- `cd apps/hermes3d-office && bun install && bun run dev` works
- One PR only touches `apps/hermes3d-office/`
- PR states reuse vs reimplementation and includes ≥1 screenshot and ≥1 video
