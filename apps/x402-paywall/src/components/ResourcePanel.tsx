import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { formatAtomicUsdc, shortenAddress } from "@/shared/x402";
import type { AgentBriefing } from "../../server/briefing";

type ResourcePanelProps = {
  locked: boolean;
  amountAtomic: string;
  briefing?: AgentBriefing;
};

export function ResourcePanel({ locked, amountAtomic, briefing }: ResourcePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected resource</CardTitle>
        <Badge tone={locked ? "amber" : "mint"}>{locked ? "locked" : "settled"}</Badge>
      </CardHeader>
      <CardBody>
        {locked || !briefing ? (
          <div className="space-y-3">
            <p className="text-lg leading-snug">
              Premium agent briefing — digital assets × AI × compute.
            </p>
            <p className="text-sm text-muted">
              GET /api/briefing is gated by x402 v2. Price{" "}
              <span className="font-mono text-amber">{formatAtomicUsdc(amountAtomic)}</span>{" "}
              exact USDC on Base Sepolia (simulated facilitator).
            </p>
            <div className="border border-dashed border-line px-3 py-6 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
              402 payment required
            </div>
          </div>
        ) : (
          <article className="space-y-4">
            <div>
              <h3 className="text-xl leading-tight">{briefing.title}</h3>
              <p className="mt-2 text-sm text-muted">{briefing.thesis}</p>
            </div>
            <ul className="space-y-3">
              {briefing.points.map((point) => (
                <li key={point.heading}>
                  <p className="font-medium text-mint">{point.heading}</p>
                  <p className="mt-1 text-sm text-muted">{point.body}</p>
                </li>
              ))}
            </ul>
            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 font-mono text-[11px] text-muted">
              <div>
                <dt>tx</dt>
                <dd className="text-ink">{shortenAddress(briefing.settlement.transaction)}</dd>
              </div>
              <div>
                <dt>payer</dt>
                <dd className="text-ink">{shortenAddress(briefing.settlement.payer)}</dd>
              </div>
            </dl>
          </article>
        )}
      </CardBody>
    </Card>
  );
}
