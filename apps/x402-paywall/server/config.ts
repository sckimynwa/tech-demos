import {
  DEFAULT_AMOUNT_ATOMIC,
  DEFAULT_MAX_TIMEOUT_SECONDS,
  DEFAULT_PAY_TO,
  DEFAULT_SIM_BALANCE_ATOMIC,
  DEFAULT_SIM_FROM,
  DEFAULT_SIM_SECRET,
  NETWORK_BASE_SEPOLIA,
  RESOURCE_PATH,
  USDC_BASE_SEPOLIA,
  X402_VERSION,
  type ResourceInfo,
} from "../src/shared/x402";

export type PlaygroundConfig = {
  mode: "simulated";
  x402Version: number;
  port: number;
  amount: string;
  network: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  simFrom: string;
  simSecret: string;
  simBalanceAtomic: string;
  resource: ResourceInfo;
};

export function resourceUrl(port: number): string {
  return `http://127.0.0.1:${port}${RESOURCE_PATH}`;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): PlaygroundConfig {
  const port = Number(env.PORT ?? 8787);
  return {
    mode: "simulated",
    x402Version: X402_VERSION,
    port,
    amount: env.X402_AMOUNT ?? DEFAULT_AMOUNT_ATOMIC,
    network: env.X402_NETWORK ?? NETWORK_BASE_SEPOLIA,
    asset: env.X402_ASSET ?? USDC_BASE_SEPOLIA,
    payTo: env.X402_PAY_TO ?? DEFAULT_PAY_TO,
    maxTimeoutSeconds: Number(env.X402_MAX_TIMEOUT_SECONDS ?? DEFAULT_MAX_TIMEOUT_SECONDS),
    simFrom: env.X402_SIM_FROM ?? DEFAULT_SIM_FROM,
    simSecret: env.X402_SIM_SECRET ?? DEFAULT_SIM_SECRET,
    simBalanceAtomic: env.X402_SIM_BALANCE ?? DEFAULT_SIM_BALANCE_ATOMIC,
    resource: {
      url: resourceUrl(port),
      description: "Premium agent briefing: digital assets × AI × HTTP 402",
      mimeType: "application/json",
    },
  };
}

export type PlaygroundPublicConfig = {
  mode: PlaygroundConfig["mode"];
  x402Version: number;
  resource: ResourceInfo;
  wallet: {
    address: string;
    startingBalanceAtomic: string;
  };
  payTo: string;
  amount: string;
  asset: string;
  network: string;
  assetSymbol: "USDC";
  simSecret: string;
  maxTimeoutSeconds: number;
};

export function toPublicConfig(config: PlaygroundConfig): PlaygroundPublicConfig {
  return {
    mode: config.mode,
    x402Version: config.x402Version,
    resource: config.resource,
    wallet: {
      address: config.simFrom,
      startingBalanceAtomic: config.simBalanceAtomic,
    },
    payTo: config.payTo,
    amount: config.amount,
    asset: config.asset,
    network: config.network,
    assetSymbol: "USDC",
    simSecret: config.simSecret,
    maxTimeoutSeconds: config.maxTimeoutSeconds,
  };
}
