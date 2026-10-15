import { describe, expect, test } from "bun:test";
import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  HEADER_PAYMENT_SIGNATURE,
  buildSimulatedPaymentPayload,
  decodeX402Header,
  encodeX402Header,
  type PaymentRequired,
  type SettlementResponse,
} from "../src/shared/x402";
import { createFetch } from "./app";
import { loadConfig } from "./config";

function testConfig() {
  return loadConfig({
    PORT: "8787",
    X402_AMOUNT: "10000",
    X402_SIM_SECRET: "test-secret",
    X402_SIM_FROM: "0x857b06519E91e3A54538791bDbb0E22373e36b66",
    X402_PAY_TO: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
  });
}

describe("x402 paywall handshake", () => {
  test("GET /api/briefing without payment returns 402 + PAYMENT-REQUIRED", async () => {
    const fetchHandler = createFetch(testConfig());
    const response = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing"),
    );
    expect(response.status).toBe(402);

    const header = response.headers.get(HEADER_PAYMENT_REQUIRED);
    expect(header).toBeTruthy();
    const required = decodeX402Header<PaymentRequired>(header!);
    expect(required.x402Version).toBe(2);
    expect(required.accepts[0]?.amount).toBe("10000");
    expect(required.accepts[0]?.extra?.simulated).toBe(true);
    expect(required.error).toContain("PAYMENT-SIGNATURE");
  });

  test("simulated pay then retry unlocks the briefing", async () => {
    const config = testConfig();
    const fetchHandler = createFetch(config);

    const quoteResponse = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing"),
    );
    const required = decodeX402Header<PaymentRequired>(
      quoteResponse.headers.get(HEADER_PAYMENT_REQUIRED)!,
    );

    const payload = await buildSimulatedPaymentPayload({
      resource: required.resource,
      accepted: required.accepts[0]!,
      from: config.simFrom,
      secret: config.simSecret,
    });

    const paid = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing", {
        headers: {
          [HEADER_PAYMENT_SIGNATURE]: encodeX402Header(payload),
        },
      }),
    );

    expect(paid.status).toBe(200);
    const settlement = decodeX402Header<SettlementResponse>(
      paid.headers.get(HEADER_PAYMENT_RESPONSE)!,
    );
    expect(settlement.success).toBe(true);
    expect(settlement.transaction.startsWith("0x")).toBe(true);

    const body = (await paid.json()) as { title: string };
    expect(body.title).toContain("HTTP 402");
  });

  test("replayed nonce is rejected", async () => {
    const config = testConfig();
    const fetchHandler = createFetch(config);
    const quoteResponse = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing"),
    );
    const required = decodeX402Header<PaymentRequired>(
      quoteResponse.headers.get(HEADER_PAYMENT_REQUIRED)!,
    );
    const payload = await buildSimulatedPaymentPayload({
      resource: required.resource,
      accepted: required.accepts[0]!,
      from: config.simFrom,
      secret: config.simSecret,
    });
    const header = encodeX402Header(payload);

    const first = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing", {
        headers: { [HEADER_PAYMENT_SIGNATURE]: header },
      }),
    );
    expect(first.status).toBe(200);

    const replay = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing", {
        headers: { [HEADER_PAYMENT_SIGNATURE]: header },
      }),
    );
    expect(replay.status).toBe(402);
    const requiredAgain = decodeX402Header<PaymentRequired>(
      replay.headers.get(HEADER_PAYMENT_REQUIRED)!,
    );
    expect(requiredAgain.error).toBe("invalid_transaction_state");
  });

  test("tampered signature returns 402", async () => {
    const config = testConfig();
    const fetchHandler = createFetch(config);
    const quoteResponse = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing"),
    );
    const required = decodeX402Header<PaymentRequired>(
      quoteResponse.headers.get(HEADER_PAYMENT_REQUIRED)!,
    );
    const payload = await buildSimulatedPaymentPayload({
      resource: required.resource,
      accepted: required.accepts[0]!,
      from: config.simFrom,
      secret: config.simSecret,
      tamperSignature: true,
    });

    const paid = await fetchHandler(
      new Request("http://127.0.0.1:8787/api/briefing", {
        headers: {
          [HEADER_PAYMENT_SIGNATURE]: encodeX402Header(payload),
        },
      }),
    );
    expect(paid.status).toBe(402);
    const body = decodeX402Header<PaymentRequired>(
      paid.headers.get(HEADER_PAYMENT_REQUIRED)!,
    );
    expect(body.error).toBe("invalid_exact_evm_payload_signature");
  });
});
