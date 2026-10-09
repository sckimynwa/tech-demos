# x402 Paywall Playground

Coinbase **x402 v2** handshake in a single-user Bun app: HTTP request → `402` + `PAYMENT-REQUIRED` → simulated USDC `PAYMENT-SIGNATURE` → retry → `200` + `PAYMENT-RESPONSE` + resource.

No CDP key. No browser wallet. The facilitator is in-process and still speaks the spec (`/verify`, `/settle`, `/supported`).

Source: [x.com/fednmad/status/2103502079491023018](https://x.com/fednmad/status/2103502079491023018)

## Run

```bash
cd apps/x402-paywall
cp .env.example .env   # optional — defaults work
bun install
bun run dev
```

UI: [http://127.0.0.1:5173](http://127.0.0.1:5173)  
API: [http://127.0.0.1:8787](http://127.0.0.1:8787)

```bash
bun test
```

## Protocol (what the UI shows)

1. `GET /api/briefing` with no payment header
2. Server returns **402** and base64 `PAYMENT-REQUIRED` (`x402Version: 2`, exact scheme, `eip155:84532`, 0.01 USDC)
3. Simulated wallet builds an EIP-3009-shaped payload and HMAC-style `0x` signature
4. Client retries with `PAYMENT-SIGNATURE`
5. Resource server `verify` → fulfill → `settle`
6. **200** + `PAYMENT-RESPONSE` + the briefing JSON

Replay the same nonce after settle → 402 `invalid_transaction_state`.  
Check **Tamper signature** to force `invalid_exact_evm_payload_signature`.

## Endpoints

| Method | Path | Role |
| --- | --- | --- |
| `GET` | `/api/briefing` | Paywalled resource |
| `GET` | `/api/playground-config` | Simulated wallet + quote for the UI |
| `GET` | `/api/health` | Liveness |
| `GET` | `/facilitator/supported` | Spec kinds |
| `POST` | `/facilitator/verify` | Spec verify |
| `POST` | `/facilitator/settle` | Spec settle + nonce ledger |

## Env

See `.env.example`. `X402_MODE` is simulated only in this MVP. On-chain Base Sepolia + CDP facilitator is deferred.

## Spec

- https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md
- https://docs.x402.org/core-concepts/http-402
