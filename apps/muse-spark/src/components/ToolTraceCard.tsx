import { Card } from "@/components/ui/card";
import type { ToolTrace } from "@/lib/types";

export function ToolTraceCard({ trace }: { trace: ToolTrace }) {
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
      <pre className="max-h-40 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
        {JSON.stringify(
          {
            arguments: trace.arguments,
            ...(trace.result !== undefined ? { result: trace.result } : {}),
          },
          null,
          2,
        )}
      </pre>
    </Card>
  );
}
