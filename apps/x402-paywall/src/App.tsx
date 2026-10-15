import { useEffect, useState } from "react";
import { ResourcePanel } from "@/components/ResourcePanel";
import { StepRail, type ProtocolStepId } from "@/components/StepRail";
import { WalletPanel } from "@/components/WalletPanel";
import { WireInspector } from "@/components/WireInspector";
import { Badge } from "@/components/ui/badge";
import { loadPlaygroundConfig, requestBriefing, type WireFrame } from "@/lib/client";
import {
  buildSimulatedPaymentPayload,
  formatAtomicUsdc,
  type PaymentPayload,
  type PaymentRequired,
} from "@/shared/x402";
import type { AgentBriefing } from "../server/briefing";
import type { PlaygroundPublicConfig } from "../server/config";

export default function App() {
  const [config, setConfig] = useState<PlaygroundPublicConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [frames, setFrames] = useState<WireFrame[]>([]);
  const [quote, setQuote] = useState<PaymentRequired | null>(null);
  const [lastPayload, setLastPayload] = useState<PaymentPayload | null>(null);
  const [briefing, setBriefing] = useState<AgentBriefing | undefined>(undefined);
  const [balanceAtomic, setBalanceAtomic] = useState("0");
  const [tamperSignature, setTamperSignature] = useState(false);
  const [spent, setSpent] = useState(false);
  const [phase, setPhase] = useState<ProtocolStepId>("request");

  useEffect(() => {
    loadPlaygroundConfig()
      .then((next) => {
        setConfig(next);
        setBalanceAtomic(next.wallet.startingBalanceAtomic);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "config failed");
      });
  }, []);

  const reset = () => {
    if (!config) {
      return;
    }
    setFrames([]);
    setQuote(null);
    setLastPayload(null);
    setBriefing(undefined);
    setBalanceAtomic(config.wallet.startingBalanceAtomic);
    setTamperSignature(false);
    setSpent(false);
    setError(null);
    setPhase("request");
  };

  const onRequest = async () => {
    setBusy(true);
    setError(null);
    setPhase("request");
    try {
      const result = await requestBriefing();
      setFrames((current) => [...current, result.frame]);
      setQuote(result.paymentRequired ?? null);
      setBriefing(undefined);
      setPhase(result.frame.status === 402 ? "quote" : "request");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "request failed");
    } finally {
      setBusy(false);
    }
  };

  const onPay = async () => {
    if (!config || !quote?.accepts[0]) {
      return;
    }
    if (BigInt(balanceAtomic) < BigInt(config.amount)) {
      setError("insufficient_funds");
      return;
    }
    setBusy(true);
    setError(null);
    setPhase("sign");
    try {
      const payload = await buildSimulatedPaymentPayload({
        resource: quote.resource,
        accepted: quote.accepts[0],
        from: config.wallet.address,
        secret: config.simSecret,
        tamperSignature,
      });
      setLastPayload(payload);
      setPhase("retry");
      const result = await requestBriefing(payload);
      setFrames((current) => [...current, result.frame]);
      if (result.briefing && result.settlement?.success) {
        setBriefing(result.briefing);
        setPhase("resource");
        if (!spent) {
          setBalanceAtomic((current) =>
            (BigInt(current) - BigInt(config.amount)).toString(),
          );
          setSpent(true);
        }
      } else {
        setQuote(result.paymentRequired ?? quote);
        setError(result.paymentRequired?.error ?? "payment failed");
        setPhase("retry");
      }
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "pay failed");
    } finally {
      setBusy(false);
    }
  };

  const onReplay = async () => {
    if (!lastPayload) {
      return;
    }
    setBusy(true);
    setError(null);
    setPhase("retry");
    try {
      const result = await requestBriefing(lastPayload);
      setFrames((current) => [...current, result.frame]);
      setError(result.paymentRequired?.error ?? "replay should 402");
    } catch (replayError) {
      setError(replayError instanceof Error ? replayError.message : "replay failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-amber">
            Coinbase x402 v2
          </p>
          <h1 className="mt-1 text-3xl tracking-tight">Paywall playground</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Request → HTTP 402 → simulated USDC exact payment → retry → resource.
            Same headers as the spec. No wallet, no CDP key.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge tone="mint">mode · simulated</Badge>
          {config ? (
            <p className="font-mono text-[11px] text-muted">
              {formatAtomicUsdc(config.amount)} · {config.network}
            </p>
          ) : null}
        </div>
      </header>

      <StepRail current={phase} />

      {error ? (
        <p className="mt-4 border border-rose/30 bg-[#2a1212] px-3 py-2 font-mono text-sm text-rose">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          {config ? (
            <WalletPanel
              address={config.wallet.address}
              balanceAtomic={balanceAtomic}
              amountAtomic={config.amount}
              network={config.network}
              canRequest={!busy}
              canPay={Boolean(quote) && !briefing}
              canReplay={Boolean(lastPayload)}
              tamperSignature={tamperSignature}
              onTamperSignatureChange={setTamperSignature}
              onRequest={onRequest}
              onPay={onPay}
              onReplay={onReplay}
              onReset={reset}
              busy={busy}
            />
          ) : (
            <p className="text-sm text-muted">Loading playground config…</p>
          )}
          <ResourcePanel
            locked={!briefing}
            amountAtomic={config?.amount ?? "10000"}
            briefing={briefing}
          />
        </div>
        <WireInspector frames={frames} />
      </div>
    </div>
  );
}
