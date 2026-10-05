import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAtomicUsdc, shortenAddress } from "@/shared/x402";

type WalletPanelProps = {
  address: string;
  balanceAtomic: string;
  amountAtomic: string;
  network: string;
  canRequest: boolean;
  canPay: boolean;
  canReplay: boolean;
  tamperSignature: boolean;
  onTamperSignatureChange: (value: boolean) => void;
  onRequest: () => void;
  onPay: () => void;
  onReplay: () => void;
  onReset: () => void;
  busy: boolean;
};

export function WalletPanel({
  address,
  balanceAtomic,
  amountAtomic,
  network,
  canRequest,
  canPay,
  canReplay,
  tamperSignature,
  onTamperSignatureChange,
  onRequest,
  onPay,
  onReplay,
  onReset,
  busy,
}: WalletPanelProps) {
  const cannotAfford = BigInt(balanceAtomic) < BigInt(amountAtomic);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulated wallet</CardTitle>
        <Badge tone="mint">USDC · no keys</Badge>
      </CardHeader>
      <CardBody className="space-y-4">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Address
            </dt>
            <dd className="mt-1 font-mono text-ink" title={address}>
              {shortenAddress(address)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Balance
            </dt>
            <dd className="mt-1 font-mono text-mint">{formatAtomicUsdc(balanceAtomic)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Quote
            </dt>
            <dd className="mt-1 font-mono text-amber">{formatAtomicUsdc(amountAtomic)}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              Network
            </dt>
            <dd className="mt-1 font-mono text-ink">{network}</dd>
          </div>
        </dl>

        <label className="flex items-center gap-2 font-mono text-[11px] text-muted">
          <input
            type="checkbox"
            checked={tamperSignature}
            onChange={(event) => onTamperSignatureChange(event.target.checked)}
          />
          Tamper signature (expect 402)
        </label>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onRequest} disabled={!canRequest || busy}>
            1. Request
          </Button>
          <Button variant="amber" onClick={onPay} disabled={!canPay || cannotAfford || busy}>
            2. Sign & pay
          </Button>
          <Button variant="ghost" onClick={onReplay} disabled={!canReplay || busy}>
            Replay nonce
          </Button>
          <Button variant="ghost" onClick={onReset} disabled={busy}>
            Reset
          </Button>
        </div>
        {cannotAfford ? (
          <p className="font-mono text-[11px] text-rose">
            Simulated wallet is broke. Reset to refill.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
