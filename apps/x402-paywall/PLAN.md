# PLAN — apps/x402-paywall

## Goal
Single-user playground that walks the **Coinbase x402 v2** handshake — HTTP request → `402` + `PAYMENT-REQUIRED` → simulated USDC `PAYMENT-SIGNATURE` → retry → `200` + `PAYMENT-RESPONSE` + resource — without real keys or on-chain settlement.

## Single-user MVP
- In: Bun resource server with one paywalled endpoint; in-process simulated facilitator (`/verify`, `/settle`, `/supported`); simulated wallet that emits a spec-shaped exact-scheme payload; mini client that visualizes each protocol step and raw headers/JSON; optional env knobs for price/payTo/network; README + `.env.example`; `bun install && bun run dev`
- Out: real CDP facilitator, live Base Sepolia USDC, EIP-712 wallet signing, auth, multi-user billing, discovery/Bazaar, Cloudflare deploy

## Tasks (vertical slices)
1. Scaffold Bun + Vite + React under `apps/x402-paywall/` with local `bunfig.toml` (`minimumReleaseAge = 259200`) and a single `dev` script that serves UI + API.
2. Implement x402 v2 HTTP transport: `GET /api/briefing` returns `402` + base64 `PAYMENT-REQUIRED`; retry with `PAYMENT-SIGNATURE` verifies via simulated facilitator, settles, returns resource + `PAYMENT-RESPONSE`.
3. Simulated wallet: generate EIP-3009-shaped authorization (from/to/value/validAfter/validBefore/nonce + sim signature). Server accepts `X402_MODE=simulated` (default) and still shows the full protocol UX.
4. Mini client: step rail (request → 402 → pay → retry → resource), decoded header inspector, wallet panel, success payload (paywalled briefing).
5. README + `.env.example`; screenshot + short video of the full handshake in the PR.

## Stack
- **Bun** — runtime / install / scripts (repo default)
- **Vite + React** — one-screen playground without Next/App Router
- **shadcn/ui** — buttons, cards, badges for the inspector
- **x402 v2 types (hand-rolled)** — match Coinbase/x402-foundation schemas; no real facilitator dependency for MVP
- **Simulated facilitator** — same `/verify` + `/settle` contract as the spec, in-memory nonce ledger

## Deferred
- Coinbase CDP facilitator + real Base Sepolia USDC
- Browser wallet / EIP-712 signing
- Discovery Bazaar + multi-resource marketplace
- Cloudflare Pages path deploy
- Session-based access / subscriptions

## Success
- `cd apps/x402-paywall && bun install && bun run dev` works with no keys
- One PR only touches `apps/x402-paywall/`
- PR includes ≥1 screenshot and ≥1 video of request → 402 → simulated pay → retry → resource

## Source
- https://x.com/fednmad/status/2103502079491023018
- Spec: https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md
