import {
  X402_VERSION,
  nowUnixSeconds,
  sha256Hex,
  simulateVerifySignature,
  type PaymentPayload,
  type PaymentRequirements,
  type SettlementResponse,
  type SupportedResponse,
  type VerifyResponse,
} from "../src/shared/x402";
import type { PlaygroundConfig } from "./config";

export type FacilitatorRequest = {
  x402Version: number;
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
};

export class SimulatedFacilitator {
  private readonly settledNonces = new Set<string>();

  constructor(private readonly config: PlaygroundConfig) {}

  supported(): SupportedResponse {
    return {
      kinds: [
        {
          x402Version: X402_VERSION,
          scheme: "exact",
          network: this.config.network,
        },
      ],
      extensions: [],
      signers: {
        "eip155:*": [this.config.simFrom],
      },
    };
  }

  async verify(request: FacilitatorRequest): Promise<VerifyResponse> {
    const payer = request.paymentPayload.payload?.authorization?.from;
    const invalid = (invalidReason: string): VerifyResponse => ({
      isValid: false,
      invalidReason,
      payer,
    });

    if (request.x402Version !== X402_VERSION) {
      return invalid("invalid_x402_version");
    }

    const payload = request.paymentPayload;
    const required = request.paymentRequirements;
    const authorization = payload.payload?.authorization;

    if (!payload?.payload || !authorization) {
      return invalid("invalid_payload");
    }

    if (payload.accepted.scheme !== "exact" || required.scheme !== "exact") {
      return invalid("invalid_scheme");
    }

    if (payload.accepted.network !== required.network) {
      return invalid("invalid_network");
    }

    if (authorization.to.toLowerCase() !== required.payTo.toLowerCase()) {
      return invalid("invalid_exact_evm_payload_recipient_mismatch");
    }

    if (authorization.value !== required.amount) {
      return invalid("invalid_exact_evm_payload_authorization_value_mismatch");
    }

    const now = nowUnixSeconds();
    if (now < Number(authorization.validAfter)) {
      return invalid("invalid_exact_evm_payload_authorization_valid_after");
    }
    if (now > Number(authorization.validBefore)) {
      return invalid("invalid_exact_evm_payload_authorization_valid_before");
    }

    if (this.settledNonces.has(authorization.nonce.toLowerCase())) {
      return invalid("invalid_transaction_state");
    }

    const signatureOk = await simulateVerifySignature(
      payload.payload,
      this.config.simSecret,
    );
    if (!signatureOk) {
      return invalid("invalid_exact_evm_payload_signature");
    }

    return { isValid: true, payer };
  }

  async settle(request: FacilitatorRequest): Promise<SettlementResponse> {
    const verified = await this.verify(request);
    const network = request.paymentRequirements.network;
    const payer = verified.payer;

    if (!verified.isValid) {
      return {
        success: false,
        errorReason: verified.invalidReason,
        payer,
        transaction: "",
        network,
      };
    }

    const nonce = request.paymentPayload.payload.authorization.nonce.toLowerCase();
    this.settledNonces.add(nonce);
    const transaction = `0x${await sha256Hex(`settle:${nonce}`)}`;

    return {
      success: true,
      payer,
      transaction,
      network,
      amount: request.paymentRequirements.amount,
    };
  }
}
