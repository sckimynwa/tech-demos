import { Badge } from "@/components/ui/badge";
import type { SystemOneResponse } from "@/shared/systemone";

type MetaStripProps = {
  mode: "mock" | "live";
  response: SystemOneResponse;
  clientMs: number;
  requestId: string | null;
};

export function MetaStrip({ mode, response, clientMs, requestId }: MetaStripProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant={mode === "live" ? "default" : "secondary"}>{mode === "live" ? "Live" : "Mock"}</Badge>
      <span className="font-mono">{response.model}</span>
      <span>
        {response.latency_ms} ms server · {clientMs} ms rtt
      </span>
      <span>
        in {response.usage.input_tokens} / out {response.usage.output_tokens}
      </span>
      {requestId ? <span className="font-mono">id {requestId}</span> : null}
    </div>
  );
}
