import { cn } from "@/lib/utils";
import type { MazeSnapshot } from "../types";

type MazeGridProps = {
  snapshot: MazeSnapshot;
};

export function MazeGrid({ snapshot }: MazeGridProps) {
  return (
    <div className="grid w-fit grid-cols-5 gap-1">
      {snapshot.cells.flat().map((cell) => {
        const isWall = cell.kind === "wall";
        const unseen = !isWall && cell.discoveredAt === null;
        return (
          <div
            key={`${cell.r}-${cell.c}`}
            title={
              isWall
                ? "wall"
                : cell.discoveredAt === null
                  ? "unseen"
                  : `loop ${cell.discoveredAt}`
            }
            className={cn(
              "flex size-9 items-center justify-center rounded-sm font-mono text-[11px] ring-1 ring-inset",
              isWall && "bg-foreground/28 text-transparent ring-transparent",
              unseen && "bg-muted/30 text-muted-foreground/50 ring-border/50",
              !isWall &&
                cell.discoveredAt !== null &&
                !cell.onPath &&
                "bg-loop/15 text-loop ring-loop/30",
              cell.onPath && "bg-ok/20 text-ok ring-ok/50",
              cell.isHead && "ring-2 ring-loop",
              cell.kind === "start" && "font-semibold",
              cell.kind === "goal" && snapshot.reachedGoal && "bg-ok text-ok-foreground ring-ok",
            )}
          >
            {cell.kind === "start" ? "S" : cell.kind === "goal" ? "G" : isWall ? "" : cell.discoveredAt ?? "·"}
          </div>
        );
      })}
    </div>
  );
}
