import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFlops, formatPct } from "../format";
import type { SweepPoint } from "../types";

type SweepChartProps = {
  points: SweepPoint[];
  activeLoops: number;
};

export function SweepChart({ points, activeLoops }: SweepChartProps) {
  const maxAcc = 1;
  const maxFlops = Math.max(...points.map((point) => point.flops), 1);

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Holdout vs loops</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <p className="text-xs text-muted-foreground">
          Accuracy on the fixed eval mix. Compute is shared-block FLOPs — linear in L, params
          stay put.
        </p>
        <div className="grid grid-cols-8 gap-2">
          {points.map((point) => {
            const active = point.loops === activeLoops;
            return (
              <div key={point.loops} className="space-y-2">
                <div className="flex h-28 items-end gap-0.5">
                  <div
                    className={`w-full rounded-sm ${active ? "bg-ok" : "bg-ok/50"}`}
                    style={{ height: `${Math.max(6, (point.accuracy / maxAcc) * 100)}%` }}
                    title={`acc ${formatPct(point.accuracy)}`}
                  />
                  <div
                    className={`w-full rounded-sm ${active ? "bg-loop" : "bg-loop/40"}`}
                    style={{ height: `${Math.max(6, (point.flops / maxFlops) * 100)}%` }}
                    title={`${formatFlops(point.flops)} FLOPs`}
                  />
                </div>
                <p className={`text-center font-mono text-[10px] ${active ? "text-loop" : "text-muted-foreground"}`}>
                  L{point.loops}
                </p>
                <p className="text-center font-mono text-[10px] text-muted-foreground tabular-nums">
                  {formatPct(point.accuracy)}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-ok" /> accuracy
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-loop" /> FLOPs
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
