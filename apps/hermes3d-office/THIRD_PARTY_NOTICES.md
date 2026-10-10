# Third-party notices

This demo is inspired by [Hermes3D](https://github.com/iamlukethedev/Hermes3D)
(MIT, Copyright 2026 Luke The Dev). The upstream license is copied at
`LICENSE.Hermes3D`.

## Reused

- Product idea: a walkable retro 3D office where AI agents are characters.
- Architecture idea from `ARCHITECTURE.md` / `CODE_DOCUMENTATION.md`: runtime
  events derive agent holds, and the scene turns those into destinations
  (desk / standup-style meeting / review bay).
- Stack choice: three.js + React Three Fiber + Drei (same office stack).
- Display names only for the 1HQ example roster.

## Not vendored / not run

Hermes3D is a Next.js Studio app with a custom Node WebSocket proxy, demo
gateway (`npm run demo-gateway`), Phaser builder, gym/QA/janitor/Spotify
surfaces, and a multi-agent remote office beta. It is not a published npm
package and cannot run self-contained via `bun install && bun run dev` from
this folder.

No Hermes3D source files were copied. The office, agents, mock stream, and
inspect panel in this app are a minimal reimplementation.
