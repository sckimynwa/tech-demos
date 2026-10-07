import { Badge } from "@/components/ui/badge";
import { Repeat2Icon } from "lucide-react";

export function LabHeader() {
  return (
    <header className="flex flex-col gap-3 border-b border-border/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-loop">
          <Repeat2Icon className="size-5" />
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase">Recurrent depth</p>
        </div>
        <h1 className="font-heading text-2xl text-foreground sm:text-3xl">
          Looped Transformer Lab
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Same unique weights, reused across loop iterations. Extra loops buy sequential
          depth — carry hops, BFS layers — without growing the parameter file. The rumored
          GPT-6.1 Sol 2-pass is this idea at scale.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">no API keys</Badge>
        <Badge variant="outline">in-browser TS</Badge>
        <Badge variant="secondary">1 shared block</Badge>
      </div>
    </header>
  );
}
