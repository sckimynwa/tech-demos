import { Activity, Clock3, Gauge, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Meter } from "./useChatStream";

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function TokMeter({ meter, busy }: { meter: Meter; busy: boolean }) {
  const needle = Math.min(180, meter.tokPerSec * 0.12);

  return (
    <Card className="overflow-hidden border-0 bg-card/70 ring-amber-500/20">
      <CardContent className="space-y-5 pt-1">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.22em] text-amber-200/70 uppercase">
            live tok/s
          </p>
          <Gauge className={`size-4 ${busy ? "animate-pulse text-amber-400" : "text-muted-foreground"}`} />
        </div>

        <div className="relative mx-auto h-28 w-full max-w-[220px]">
          <div className="absolute inset-x-4 bottom-0 h-24 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-24 rounded-t-full border border-amber-500/25 bg-gradient-to-b from-amber-500/15 to-transparent" />
            <div
              className="absolute bottom-0 left-1/2 h-[88px] w-[2px] origin-bottom bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-transform duration-150"
              style={{ transform: `translateX(-50%) rotate(${needle - 90}deg)` }}
            />
          </div>
        </div>

        <div className="text-center">
          <p className="font-mono text-5xl leading-none font-semibold tracking-tight text-amber-300 tabular-nums">
            {meter.tokPerSec.toFixed(0)}
          </p>
          <p className="mt-2 font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            tokens / sec
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Clock3} label="TTFT" value={formatMs(meter.ttftMs)} />
          <Stat icon={Hash} label="tokens" value={String(meter.tokens)} />
          <Stat icon={Activity} label="elapsed" value={formatMs(meter.elapsedMs || null)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-background/50 px-2 py-2 ring-1 ring-white/5">
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3" />
        <span className="font-mono text-[10px] tracking-wider uppercase">{label}</span>
      </div>
      <p className="mt-1 font-mono text-sm text-amber-50 tabular-nums">{value}</p>
    </div>
  );
}
