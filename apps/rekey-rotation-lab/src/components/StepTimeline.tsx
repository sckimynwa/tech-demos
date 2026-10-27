import { useEffect, useRef } from "react";
import type { LabStep, World } from "@/domain/types.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace.tsx";
import { StepDetail } from "./StepDetail.tsx";

export function StepTimeline({
  steps,
  cursor,
  playing,
  world,
  onSelect,
}: {
  steps: LabStep[];
  cursor: number;
  playing: boolean;
  world: World;
  onSelect: (cursor: number) => void;
}) {
  const activeRef = useRef<HTMLDivElement>(null);
  const active = steps[cursor - 1] ?? null;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  return (
    <div className="grid gap-4" data-testid="timeline">
      <ScrollArea className="h-80 pr-3">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No steps yet. Rotate walks preflight, issue, vault save, then file → GitHub → Supabase → Vercel.
          </p>
        ) : (
          <Trace>
            {steps.map((step, index) => {
              const number = index + 1;
              const selected = number === cursor;
              const status = step.tone === "error" ? "error" : playing && selected ? "running" : undefined;
              return (
                <div key={step.id} ref={selected ? activeRef : undefined}>
                  <TraceCollapsible
                    open={selected}
                    onOpenChange={(open) => {
                      if (open) {
                        onSelect(number);
                      }
                    }}
                  >
                    <TraceCollapsibleTrigger>
                      <TraceLine status={status}>
                        <TraceTitle>{step.title}</TraceTitle>
                      </TraceLine>
                    </TraceCollapsibleTrigger>
                    <TraceCollapsibleContent>
                      <p className="text-xs">{step.detail}</p>
                    </TraceCollapsibleContent>
                  </TraceCollapsible>
                </div>
              );
            })}
          </Trace>
        )}
      </ScrollArea>
      <StepDetail step={active} world={world} />
    </div>
  );
}
