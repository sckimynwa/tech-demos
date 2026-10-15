import { cn } from "@/lib/utils";
import type { DigitCell } from "../types";

type DigitTapeProps = {
  digits: DigitCell[];
  compact?: boolean;
};

export function DigitTape({ digits, compact = false }: DigitTapeProps) {
  return (
    <div className="flex gap-1.5">
      {digits.map((cell, index) => (
        <div key={`${cell.value}-${index}`} className="space-y-1">
          <div
            className={cn(
              "flex items-center justify-center rounded-md font-mono ring-1",
              compact ? "h-9 w-8 text-lg" : "h-12 w-10 text-2xl",
              cell.correct && cell.resolved && "bg-ok/15 text-ok ring-ok/40",
              cell.correct && !cell.resolved && "bg-loop/10 text-loop ring-loop/30",
              !cell.correct && "bg-bad/10 text-bad ring-bad/35",
            )}
          >
            {cell.value}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full", cell.correct ? "bg-ok" : "bg-loop")}
              style={{ width: `${Math.round(cell.confidence * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
