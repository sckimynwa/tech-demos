import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
};

export function MetricCard({ label, value, hint, accent = false }: MetricCardProps) {
  return (
    <Card size="sm" className={accent ? "bg-loop/8 ring-loop/30" : undefined}>
      <CardContent className="space-y-1">
        <p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-mono text-xl text-foreground tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
