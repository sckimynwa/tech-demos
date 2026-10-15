import { describe, expect, test } from "bun:test";
import {
  buildSimulatedPaymentPayload,
  decodeX402Header,
  encodeX402Header,
  formatAtomicUsdc,
  simulateSign,
  simulateVerifySignature,
  type PaymentRequired,
} from "./x402";

const secret = "x402-simulated-wallet";

describe("x402 header codec", () => {
  test("round-trips PaymentRequired JSON", () => {
    const required: PaymentRequired = {
      x402Version: 2,
      error: "PAYMENT-SIGNATURE header is required",
      resource: {
        url: "http://localhost/api/briefing",
        description: "Premium briefing",
        mimeType: "application/json",
      },
      accepts: [
        {
          scheme: "exact",
          network: "eip155:84532",
          amount: "10000",
          asset: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          payTo: "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
          maxTimeoutSeconds: 60,
          extra: { name: "USDC", version: "2", simulated: true },
        },
      ],
      extensions: {},
    };

    const decoded = decodeX402Header<PaymentRequired>(encodeX402Header(required));
    expect(decoded).toEqual(required);
  });
});

describe("simulated exact-scheme signature", () => {
  test("signs and verifies a payload", async () => {
    const payload = await buildSimulatedPaymentPayload({
      resource: { url: "http://localhost/api/briefing" },
      accepted: {
        scheme: "exact",
        network: "eip155:84532",
        amount: "10000",
        asset: "0xasset",
        payTo: "0xpayto",
        maxTimeoutSeconds: 60,
      },
      from: "0xfrom",
      secret,
    });

    expect(payload.payload.signature.startsWith("0x")).toBe(true);
    expect(await simulateVerifySignature(payload.payload, secret)).toBe(true);
    expect(await simulateVerifySignature(payload.payload, "wrong")).toBe(false);
  });

  test("tampered signature fails verify", async () => {
    const authorization = {
      from: "0xfrom",
      to: "0xto",
      value: "10000",
      validAfter: "1",
      validBefore: "2",
      nonce: "0xabc",
    };
    const signature = await simulateSign(authorization, secret);
    expect(
      await simulateVerifySignature(
        { signature: `${signature.slice(0, -2)}ff`, authorization },
        secret,
      ),
    ).toBe(false);
  });
});

describe("formatAtomicUsdc", () => {
  test("formats 0.01 USDC", () => {
    expect(formatAtomicUsdc("10000")).toBe("0.01 USDC");
  });

  test("formats whole USDC", () => {
    expect(formatAtomicUsdc("25000000")).toBe("25 USDC");
  });
});
