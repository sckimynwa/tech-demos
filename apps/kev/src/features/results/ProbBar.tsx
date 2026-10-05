import { cn } from "@/lib/utils";

type ProbBarProps = {
  label: string;
  value: number;
  highlight?: boolean;
};

export function ProbBar({ label, value, highlight = false }: ProbBarProps) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn("text-sm", highlight ? "font-medium text-foreground" : "text-muted-foreground")}>
            {label}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-[width] duration-300", highlight ? "bg-primary" : "bg-foreground/35")}
            style={{ width: `${pct * 100}%` }}
          />
        </div>
      </div>
      <span className="text-right font-mono text-xs tabular-nums">{pct.toFixed(2)}</span>
    </div>
  );
}
