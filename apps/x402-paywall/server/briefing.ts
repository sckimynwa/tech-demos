export type AgentBriefing = {
  title: string;
  unlockedAt: string;
  price: string;
  settlement: {
    network: string;
    transaction: string;
    payer: string;
  };
  thesis: string;
  points: { heading: string; body: string }[];
  source: {
    tweet: string;
    spec: string;
  };
};

export function buildBriefing(input: {
  price: string;
  network: string;
  transaction: string;
  payer: string;
}): AgentBriefing {
  return {
    title: "Agent briefing: HTTP 402 as the commerce rail",
    unlockedAt: new Date().toISOString(),
    price: input.price,
    settlement: {
      network: input.network,
      transaction: input.transaction,
      payer: input.payer,
    },
    thesis:
      "Digital assets stop being a side ledger when AI agents, commerce, and compute can settle inside the request itself. x402 spends the reserved 402 status as a machine-readable invoice.",
    points: [
      {
        heading: "Request is the checkout",
        body: "A client hits a resource. The server answers 402 with a base64 PAYMENT-REQUIRED quote — scheme, CAIP-2 network, atomic USDC amount, payTo. No account, no session cookie.",
      },
      {
        heading: "Signature is the cart",
        body: "The wallet (here: simulated) picks an accepted exact-scheme option and attaches a PAYMENT-SIGNATURE. Shape matches EIP-3009 transferWithAuthorization: from, to, value, window, nonce.",
      },
      {
        heading: "Facilitator is the clearing desk",
        body: "The resource server POSTs verify then settle. Coinbase CDP can do this on Base Sepolia. This playground does the same contract in-process so the UX is real without keys.",
      },
      {
        heading: "Resource is the receipt",
        body: "200 comes back with the payload plus PAYMENT-RESPONSE (tx hash, payer, network). Replay dies on the nonce ledger. That is the whole product.",
      },
    ],
    source: {
      tweet: "https://x.com/fednmad/status/2103502079491023018",
      spec: "https://github.com/coinbase/x402/blob/main/specs/x402-specification-v2.md",
    },
  };
}
