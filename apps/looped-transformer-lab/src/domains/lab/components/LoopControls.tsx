import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DicesIcon } from "lucide-react";
import { MAX_LOOPS, MIN_LOOPS } from "../constants";
import { MAZES } from "../maze";
import { ADDITION_PRESETS } from "../presets";
import type { TaskId } from "../types";

type LoopControlsProps = {
  task: TaskId;
  onTask: (task: TaskId) => void;
  loops: number;
  onLoops: (loops: number) => void;
  presetId: string;
  onPreset: (id: string) => void;
  a: number;
  b: number;
  onOperand: (which: "a" | "b", raw: string) => void;
  onRandom: () => void;
  mazeId: string;
  onMaze: (id: string) => void;
};

export function LoopControls({
  task,
  onTask,
  loops,
  onLoops,
  presetId,
  onPreset,
  a,
  b,
  onOperand,
  onRandom,
  mazeId,
  onMaze,
}: LoopControlsProps) {
  return (
    <section className="grid gap-5 rounded-xl bg-card p-4 ring-1 ring-foreground/10 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-4">
        <Tabs value={task} onValueChange={(value) => onTask(value as TaskId)}>
          <TabsList>
            <TabsTrigger value="addition">3-digit addition</TabsTrigger>
            <TabsTrigger value="maze">5×5 maze</TabsTrigger>
          </TabsList>
        </Tabs>

        {task === "addition" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ADDITION_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  size="sm"
                  variant={presetId === preset.id ? "default" : "outline"}
                  onClick={() => onPreset(preset.id)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={onRandom}>
                <DicesIcon data-icon="inline-start" />
                Random
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="op-a" className="font-mono text-[10px] tracking-widest uppercase">
                  A
                </Label>
                <Input
                  id="op-a"
                  inputMode="numeric"
                  value={String(a)}
                  onChange={(event) => onOperand("a", event.target.value)}
                  className="w-24 font-mono"
                />
              </div>
              <span className="pb-2 font-mono text-lg text-muted-foreground">+</span>
              <div className="space-y-1">
                <Label htmlFor="op-b" className="font-mono text-[10px] tracking-widest uppercase">
                  B
                </Label>
                <Input
                  id="op-b"
                  inputMode="numeric"
                  value={String(b)}
                  onChange={(event) => onOperand("b", event.target.value)}
                  className="w-24 font-mono"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {ADDITION_PRESETS.find((preset) => preset.id === presetId)?.hint ??
                "Each loop consumes the previous place's carry. A chain of k carries needs k+1 loops."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {MAZES.map((maze) => (
                <Button
                  key={maze.id}
                  size="sm"
                  variant={mazeId === maze.id ? "default" : "outline"}
                  onClick={() => onMaze(maze.id)}
                >
                  {maze.name}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {MAZES.find((maze) => maze.id === mazeId)?.hint}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-lg bg-muted/40 p-3">
        <div className="flex items-baseline justify-between">
          <Label className="font-mono text-[10px] tracking-[0.18em] uppercase">Loop count</Label>
          <p className="font-mono text-3xl text-loop tabular-nums">{loops}</p>
        </div>
        <Slider
          min={MIN_LOOPS}
          max={MAX_LOOPS}
          step={1}
          value={[loops]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            if (typeof next === "number") onLoops(next);
          }}
        />
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>1 · plain</span>
          <span>8 · max depth</span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Looped applies the <span className="text-foreground">same W</span> {loops}×.
          Plain is the identical block once — same unique params, less sequential compute.
        </p>
      </div>
    </section>
  );
}
