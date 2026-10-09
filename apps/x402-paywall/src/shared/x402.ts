export const X402_VERSION = 2;

export const HEADER_PAYMENT_REQUIRED = "PAYMENT-REQUIRED";
export const HEADER_PAYMENT_SIGNATURE = "PAYMENT-SIGNATURE";
export const HEADER_PAYMENT_RESPONSE = "PAYMENT-RESPONSE";

export const USDC_DECIMALS = 6;
export const DEFAULT_AMOUNT_ATOMIC = "10000";
export const NETWORK_BASE_SEPOLIA = "eip155:84532";
export const USDC_BASE_SEPOLIA =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const DEFAULT_PAY_TO =
  "0x209693Bc6afc0C5328bA36FaF03C514EF312287C";
export const DEFAULT_SIM_FROM =
  "0x857b06519E91e3A54538791bDbb0E22373e36b66";
export const DEFAULT_SIM_SECRET = "x402-simulated-wallet";
export const DEFAULT_SIM_BALANCE_ATOMIC = "25000000";
export const DEFAULT_MAX_TIMEOUT_SECONDS = 60;
export const RESOURCE_PATH = "/api/briefing";

export type ResourceInfo = {
  url: string;
  description?: string;
  mimeType?: string;
};

export type PaymentRequirements = {
  scheme: "exact";
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: {
    name?: string;
    version?: string;
    simulated?: boolean;
  };
};

export type PaymentRequired = {
  x402Version: number;
  error?: string;
  resource: ResourceInfo;
  accepts: PaymentRequirements[];
  extensions?: Record<string, unknown>;
};

export type ExactEvmAuthorization = {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
};

export type ExactEvmPayload = {
  signature: string;
  authorization: ExactEvmAuthorization;
};

export type PaymentPayload = {
  x402Version: number;
  resource?: ResourceInfo;
  accepted: PaymentRequirements;
  payload: ExactEvmPayload;
  extensions?: Record<string, unknown>;
};

export type SettlementResponse = {
  success: boolean;
  errorReason?: string;
  payer?: string;
  transaction: string;
  network: string;
  amount?: string;
};

export type VerifyResponse = {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
};

export type SupportedKind = {
  x402Version: number;
  scheme: string;
  network: string;
};

export type SupportedResponse = {
  kinds: SupportedKind[];
  extensions: string[];
  signers: Record<string, string[]>;
};

export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function base64ToUtf8(encoded: string): string {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeX402Header(value: unknown): string {
  return utf8ToBase64(JSON.stringify(value));
}

export function decodeX402Header<T>(header: string): T {
  return JSON.parse(base64ToUtf8(header)) as T;
}

export function canonicalAuthorization(
  authorization: ExactEvmAuthorization,
): string {
  return [
    authorization.from,
    authorization.to,
    authorization.value,
    authorization.validAfter,
    authorization.validBefore,
    authorization.nonce,
  ].join("|");
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function simulateSign(
  authorization: ExactEvmAuthorization,
  secret: string,
): Promise<string> {
  const digest = await sha256Hex(
    `${secret}:${canonicalAuthorization(authorization)}`,
  );
  return `0x${digest}`;
}

export async function simulateVerifySignature(
  payload: ExactEvmPayload,
  secret: string,
): Promise<boolean> {
  const expected = await simulateSign(payload.authorization, secret);
  return expected.toLowerCase() === payload.signature.toLowerCase();
}

export function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function formatAtomicUsdc(atomic: string): string {
  const value = BigInt(atomic);
  const base = 10n ** BigInt(USDC_DECIMALS);
  const whole = value / base;
  const fraction = value % base;
  const fractionText = fraction.toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
  return fractionText.length === 0
    ? `${whole.toString()} USDC`
    : `${whole.toString()}.${fractionText} USDC`;
}

export function shortenAddress(address: string): string {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function buildSimulatedAuthorization(input: {
  from: string;
  to: string;
  value: string;
  maxTimeoutSeconds: number;
  now?: number;
  nonce?: string;
}): ExactEvmAuthorization {
  const now = input.now ?? nowUnixSeconds();
  return {
    from: input.from,
    to: input.to,
    value: input.value,
    validAfter: String(now - 1),
    validBefore: String(now + input.maxTimeoutSeconds),
    nonce: input.nonce ?? randomNonce(),
  };
}

export async function buildSimulatedPaymentPayload(input: {
  resource: ResourceInfo;
  accepted: PaymentRequirements;
  from: string;
  secret: string;
  tamperSignature?: boolean;
  now?: number;
}): Promise<PaymentPayload> {
  const authorization = buildSimulatedAuthorization({
    from: input.from,
    to: input.accepted.payTo,
    value: input.accepted.amount,
    maxTimeoutSeconds: input.accepted.maxTimeoutSeconds,
    now: input.now,
  });
  let signature = await simulateSign(authorization, input.secret);
  if (input.tamperSignature) {
    signature = `${signature.slice(0, -2)}00`;
  }
  return {
    x402Version: X402_VERSION,
    resource: input.resource,
    accepted: input.accepted,
    payload: { signature, authorization },
    extensions: {},
  };
}
