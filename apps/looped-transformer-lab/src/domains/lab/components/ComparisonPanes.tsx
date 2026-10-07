import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdditionTrace, MazeTrace, TaskId } from "../types";
import { DigitTape } from "./DigitTape";
import { MazeGrid } from "./MazeGrid";

type ComparisonPanesProps = {
  task: TaskId;
  loopedAddition: AdditionTrace;
  plainAddition: AdditionTrace;
  loopedMaze: MazeTrace;
  plainMaze: MazeTrace;
};

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "outline"} className={ok ? "bg-ok text-ok-foreground" : undefined}>
      {ok ? `${label} exact` : `${label} miss`}
    </Badge>
  );
}

export function ComparisonPanes({
  task,
  loopedAddition,
  plainAddition,
  loopedMaze,
  plainMaze,
}: ComparisonPanesProps) {
  const loopedAdd = loopedAddition.snapshots[loopedAddition.snapshots.length - 1]!;
  const plainAdd = plainAddition.snapshots[0]!;
  const loopedMz = loopedMaze.snapshots[loopedMaze.snapshots.length - 1]!;
  const plainMz = plainMaze.snapshots[0]!;

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="bg-loop/5 ring-loop/25">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Looped · shared W × {loopedAdd.loop}</CardTitle>
            {task === "addition" ? (
              <StatusBadge ok={loopedAdd.correct} label="sum" />
            ) : (
              <StatusBadge ok={loopedMz.reachedGoal} label="goal" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {task === "addition" ? (
            <>
              <p className="font-mono text-xs text-muted-foreground">
                {loopedAddition.problem.a} + {loopedAddition.problem.b} = {loopedAddition.problem.sum}
              </p>
              <DigitTape digits={loopedAdd.digits} />
              <p className="font-mono text-sm tabular-nums">
                pred {String(loopedAdd.predicted).padStart(4, "0")} · target{" "}
                {String(loopedAdd.target).padStart(4, "0")}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                BFS layer {loopedMz.loop} / distance {loopedMaze.maze.distance}
              </p>
              <MazeGrid snapshot={loopedMz} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Plain · same params × 1</CardTitle>
            {task === "addition" ? (
              <StatusBadge ok={plainAdd.correct} label="sum" />
            ) : (
              <StatusBadge ok={plainMz.reachedGoal} label="goal" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {task === "addition" ? (
            <>
              <p className="font-mono text-xs text-muted-foreground">
                Identical block, no reuse. Local sums only — carries never move.
              </p>
              <DigitTape digits={plainAdd.digits} />
              <p className="font-mono text-sm tabular-nums">
                pred {String(plainAdd.predicted).padStart(4, "0")} · target{" "}
                {String(plainAdd.target).padStart(4, "0")}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">One BFS layer. Start neighborhood only.</p>
              <MazeGrid snapshot={plainMz} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
