import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  HEADER_PAYMENT_SIGNATURE,
  X402_VERSION,
  decodeX402Header,
  encodeX402Header,
  formatAtomicUsdc,
  type PaymentPayload,
  type PaymentRequired,
  type PaymentRequirements,
} from "../src/shared/x402";
import { buildBriefing } from "./briefing";
import { toPublicConfig, type PlaygroundConfig } from "./config";
import { SimulatedFacilitator, type FacilitatorRequest } from "./facilitator";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": `${HEADER_PAYMENT_SIGNATURE}, Content-Type`,
  "Access-Control-Expose-Headers": `${HEADER_PAYMENT_REQUIRED}, ${HEADER_PAYMENT_RESPONSE}`,
};

function json(status: number, body: unknown, extra?: HeadersInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS_HEADERS,
      ...extra,
    },
  });
}

function readHeader(request: Request, name: string): string | null {
  return request.headers.get(name) ?? request.headers.get(name.toLowerCase());
}

export function createFetch(config: PlaygroundConfig) {
  const facilitator = new SimulatedFacilitator(config);

  const accepted = (): PaymentRequirements => ({
    scheme: "exact",
    network: config.network,
    amount: config.amount,
    asset: config.asset,
    payTo: config.payTo,
    maxTimeoutSeconds: config.maxTimeoutSeconds,
    extra: {
      name: "USDC",
      version: "2",
      simulated: true,
    },
  });

  const quote = (error: string): PaymentRequired => ({
    x402Version: X402_VERSION,
    error,
    resource: config.resource,
    accepts: [accepted()],
    extensions: {},
  });

  const paymentRequired = (error: string): Response => {
    const body = quote(error);
    return json(402, body, {
      [HEADER_PAYMENT_REQUIRED]: encodeX402Header(body),
    });
  };

  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json(200, { ok: true, mode: config.mode, x402Version: X402_VERSION });
    }

    if (url.pathname === "/api/playground-config" && request.method === "GET") {
      return json(200, toPublicConfig(config));
    }

    if (url.pathname === "/facilitator/supported" && request.method === "GET") {
      return json(200, facilitator.supported());
    }

    if (url.pathname === "/facilitator/verify" && request.method === "POST") {
      const body = (await request.json()) as FacilitatorRequest;
      return json(200, await facilitator.verify(body));
    }

    if (url.pathname === "/facilitator/settle" && request.method === "POST") {
      const body = (await request.json()) as FacilitatorRequest;
      return json(200, await facilitator.settle(body));
    }

    if (url.pathname === "/api/briefing" && request.method === "GET") {
      const signatureHeader = readHeader(request, HEADER_PAYMENT_SIGNATURE);
      if (!signatureHeader) {
        return paymentRequired("PAYMENT-SIGNATURE header is required");
      }

      let paymentPayload: PaymentPayload;
      try {
        paymentPayload = decodeX402Header<PaymentPayload>(signatureHeader);
      } catch {
        return json(400, { error: "invalid_payload" });
      }

      const paymentRequirements = accepted();
      const facilitatorRequest: FacilitatorRequest = {
        x402Version: X402_VERSION,
        paymentPayload,
        paymentRequirements,
      };

      const verified = await facilitator.verify(facilitatorRequest);
      if (!verified.isValid) {
        return paymentRequired(verified.invalidReason ?? "invalid_payload");
      }

      const settlement = await facilitator.settle(facilitatorRequest);
      if (!settlement.success) {
        return json(
          402,
          quote(settlement.errorReason ?? "unexpected_settle_error"),
          {
            [HEADER_PAYMENT_REQUIRED]: encodeX402Header(
              quote(settlement.errorReason ?? "unexpected_settle_error"),
            ),
            [HEADER_PAYMENT_RESPONSE]: encodeX402Header(settlement),
          },
        );
      }

      const briefing = buildBriefing({
        price: formatAtomicUsdc(config.amount),
        network: settlement.network,
        transaction: settlement.transaction,
        payer: settlement.payer ?? paymentPayload.payload.authorization.from,
      });

      return json(200, briefing, {
        [HEADER_PAYMENT_RESPONSE]: encodeX402Header(settlement),
      });
    }

    return json(404, { error: "not_found" });
  };
}
