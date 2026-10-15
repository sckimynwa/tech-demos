import { formatFlops, formatMs, formatParams, formatPct } from "../format";
import type { Metrics } from "../types";
import { MetricCard } from "./MetricCard";

type MetricsRowProps = {
  looped: Metrics;
  plain: Metrics;
};

export function MetricsRow({ looped, plain }: MetricsRowProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        accent
        label="Looped acc"
        value={formatPct(looped.accuracy)}
        hint={`${looped.exactCorrect}/${looped.total} holdout exact`}
      />
      <MetricCard
        label="Plain acc"
        value={formatPct(plain.accuracy)}
        hint="Same W, one pass"
      />
      <MetricCard
        label="Latency"
        value={formatMs(looped.latencyMs)}
        hint={`plain ${formatMs(plain.latencyMs)}`}
      />
      <MetricCard
        label="Compute"
        value={formatFlops(looped.flops)}
        hint={`${formatFlops(plain.flops)} FLOPs @ L=1`}
      />
      <MetricCard
        label="Unique params"
        value={formatParams(looped.uniqueParams)}
        hint="tied for both models"
      />
      <MetricCard
        label="Effective depth"
        value={`${looped.effectiveDepth}×`}
        hint={`unrolled ${formatParams(looped.unrolledParams)}`}
      />
    </div>
  );
}
