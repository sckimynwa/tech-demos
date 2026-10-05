import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import type { WireFrame } from "@/lib/client";

type WireInspectorProps = {
  frames: WireFrame[];
};

function statusTone(status?: number): "amber" | "mint" | "muted" {
  if (status === 402) {
    return "amber";
  }
  if (status === 200) {
    return "mint";
  }
  return "muted";
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === undefined) {
    return null;
  }
  return (
    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-sm bg-paper p-3 font-mono text-[11px] leading-5 text-ink/90">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function WireInspector({ frames }: WireInspectorProps) {
  const latest = frames.at(-1);

  return (
    <Card className="min-h-full">
      <CardHeader>
        <CardTitle>Wire</CardTitle>
        {latest?.status ? (
          <Badge tone={statusTone(latest.status)}>HTTP {latest.status}</Badge>
        ) : (
          <Badge>idle</Badge>
        )}
      </CardHeader>
      <CardBody className="space-y-4">
        {frames.length === 0 ? (
          <p className="text-sm text-muted">
            Hit request. You should see GET /api/briefing → 402 + base64{" "}
            <span className="text-amber">PAYMENT-REQUIRED</span>.
          </p>
        ) : null}

        {frames.map((frame) => (
          <article key={frame.id} className="border border-line bg-paper/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                {frame.title}
              </p>
              <span className="font-mono text-[11px] text-muted">
                {frame.method} {frame.path}
                {frame.status ? ` → ${frame.status}` : ""}
              </span>
            </div>
            {frame.decoded.paymentPayload ? (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint">
                  PAYMENT-SIGNATURE
                </p>
                <JsonBlock value={frame.decoded.paymentPayload} />
              </div>
            ) : null}
            {frame.decoded.paymentRequired ? (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                  PAYMENT-REQUIRED
                </p>
                <JsonBlock value={frame.decoded.paymentRequired} />
              </div>
            ) : null}
            {frame.decoded.settlement ? (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint">
                  PAYMENT-RESPONSE
                </p>
                <JsonBlock value={frame.decoded.settlement} />
              </div>
            ) : null}
            {frame.status === 200 ? (
              <div className="mt-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  body
                </p>
                <JsonBlock value={frame.decoded.body} />
              </div>
            ) : null}
          </article>
        ))}
      </CardBody>
    </Card>
  );
}
