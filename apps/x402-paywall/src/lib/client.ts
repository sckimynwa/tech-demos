import {
  HEADER_PAYMENT_REQUIRED,
  HEADER_PAYMENT_RESPONSE,
  HEADER_PAYMENT_SIGNATURE,
  decodeX402Header,
  encodeX402Header,
  type PaymentPayload,
  type PaymentRequired,
  type SettlementResponse,
} from "@/shared/x402";
import type { PlaygroundPublicConfig } from "../../server/config";
import type { AgentBriefing } from "../../server/briefing";

export type WireFrame = {
  id: string;
  at: string;
  title: string;
  method: string;
  path: string;
  status?: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  decoded: {
    paymentRequired?: PaymentRequired;
    paymentPayload?: PaymentPayload;
    settlement?: SettlementResponse;
    body?: unknown;
  };
};

function headerRecord(headers: Headers, names: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const name of names) {
    const value = headers.get(name);
    if (value) {
      record[name] = value;
    }
  }
  return record;
}

export async function loadPlaygroundConfig(): Promise<PlaygroundPublicConfig> {
  const response = await fetch("/api/playground-config");
  if (!response.ok) {
    throw new Error(`config ${response.status}`);
  }
  return (await response.json()) as PlaygroundPublicConfig;
}

export async function requestBriefing(paymentPayload?: PaymentPayload): Promise<{
  frame: WireFrame;
  paymentRequired?: PaymentRequired;
  settlement?: SettlementResponse;
  briefing?: AgentBriefing;
}> {
  const requestHeaders: Record<string, string> = {};
  if (paymentPayload) {
    requestHeaders[HEADER_PAYMENT_SIGNATURE] = encodeX402Header(paymentPayload);
  }

  const response = await fetch("/api/briefing", { headers: requestHeaders });
  const body = await response.json();

  const paymentRequiredHeader = response.headers.get(HEADER_PAYMENT_REQUIRED);
  const settlementHeader = response.headers.get(HEADER_PAYMENT_RESPONSE);

  const paymentRequired = paymentRequiredHeader
    ? decodeX402Header<PaymentRequired>(paymentRequiredHeader)
    : response.status === 402
      ? (body as PaymentRequired)
      : undefined;
  const settlement = settlementHeader
    ? decodeX402Header<SettlementResponse>(settlementHeader)
    : undefined;

  const frame: WireFrame = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    title: paymentPayload ? "RETRY + PAYMENT-SIGNATURE" : "REQUEST",
    method: "GET",
    path: "/api/briefing",
    status: response.status,
    requestHeaders,
    responseHeaders: headerRecord(response.headers, [
      HEADER_PAYMENT_REQUIRED,
      HEADER_PAYMENT_RESPONSE,
      "content-type",
    ]),
    decoded: {
      paymentRequired,
      paymentPayload,
      settlement,
      body,
    },
  };

  return {
    frame,
    paymentRequired,
    settlement,
    briefing: response.status === 200 ? (body as AgentBriefing) : undefined,
  };
}
