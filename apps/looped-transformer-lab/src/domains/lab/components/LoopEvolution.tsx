import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADD_SEQ_LEN } from "../constants";
import type { AdditionTrace, MazeTrace, TaskId } from "../types";
import { DigitTape } from "./DigitTape";
import { MazeGrid } from "./MazeGrid";

type LoopEvolutionProps = {
  task: TaskId;
  addition: AdditionTrace;
  maze: MazeTrace;
};

const SEQ_LABELS = ["A2", "A1", "A0", "+", "B2", "B1", "B0", "=", "S3", "S2", "S1", "S0"];

function AttentionStrip({ attn }: { attn: number[][] }) {
  const last = attn[attn.length - 1] ?? attn[0];
  if (!last || last.length !== ADD_SEQ_LEN) return null;
  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Ones-place attention
      </p>
      <div className="grid grid-cols-12 gap-1">
        {last.map((weight, index) => (
          <div key={SEQ_LABELS[index]} className="space-y-1 text-center">
            <div className="h-8 rounded-sm bg-loop/15 ring-1 ring-loop/20">
              <div
                className="mx-auto h-full w-full rounded-sm bg-loop"
                style={{ opacity: Math.min(1, weight * 3) }}
              />
            </div>
            <p className="font-mono text-[9px] text-muted-foreground">{SEQ_LABELS[index]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoopEvolution({ task, addition, maze }: LoopEvolutionProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Prediction after each loop</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {task === "addition" ? (
          <>
            <p className="text-xs text-muted-foreground">
              Carry is written in loop t and read by the next place in loop t+1. That is
              recurrent depth: sequential hops, reused W.
            </p>
            <div className="space-y-3">
              {addition.snapshots.map((snap) => (
                <div key={snap.loop} className="flex flex-wrap items-center gap-3">
                  <p className="w-10 font-mono text-xs text-loop">L{snap.loop}</p>
                  <DigitTape digits={snap.digits} compact />
                  <p className="font-mono text-xs text-muted-foreground tabular-nums">
                    {String(snap.predicted).padStart(4, "0")}
                    {snap.correct ? "  ✓" : ""}
                  </p>
                  <div className="flex gap-1 font-mono text-[10px] text-muted-foreground">
                    {snap.digits
                      .slice()
                      .reverse()
                      .map((cell, index) => (
                        <span key={`${snap.loop}-c-${index}`}>
                          c{index}={cell.carryOut}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <AttentionStrip attn={addition.snapshots[addition.snapshots.length - 1]!.attn} />
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Each loop expands the BFS wavefront one hop. The plain model is stuck at hop 1.
            </p>
            <div className="flex flex-wrap gap-4">
              {maze.snapshots.map((snap) => (
                <div key={snap.loop} className="space-y-2">
                  <p className="font-mono text-xs text-loop">
                    L{snap.loop}
                    {snap.reachedGoal ? "  ✓ goal" : ""}
                  </p>
                  <MazeGrid snapshot={snap} />
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
