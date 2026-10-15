import { Card } from "@/components/ui/card";
import type { ToolTrace } from "@/lib/types";

const HIDDEN_RESULT_KEYS = new Set(["note", "source", "iso"]);

function rowsFrom(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value === undefined ? [] : [["value", String(value)]];
  }

  return Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !HIDDEN_RESULT_KEYS.has(key))
    .map(([key, nested]) => [
      key,
      typeof nested === "string" ? nested : JSON.stringify(nested),
    ]);
}

export function ToolTraceCard({ trace }: { trace: ToolTrace }) {
  const argumentRows = rowsFrom(trace.arguments);
  const resultRows = trace.status === "done" ? rowsFrom(trace.result) : [];

  return (
    <Card className="overflow-hidden bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-primary">tool</span>
          <span className="font-mono text-xs">{trace.name}</span>
        </div>
        <span className="font-mono text-[10px] uppercase text-muted-foreground">
          {trace.status}
        </span>
      </div>
      <div className="grid gap-1 px-3 py-2 font-mono text-[11px] leading-relaxed">
        {argumentRows.map(([key, value]) => (
          <div key={`arg-${key}`} className="grid grid-cols-[7.5rem_1fr] gap-2">
            <span className="text-muted-foreground">{key}</span>
            <span className="break-all text-foreground/90">{value}</span>
          </div>
        ))}
        {resultRows.map(([key, value]) => (
          <div key={`res-${key}`} className="grid grid-cols-[7.5rem_1fr] gap-2">
            <span className="text-primary/80">{key}</span>
            <span className="break-all text-foreground/90">{value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
