import { useEffect, useState } from "react";
import { canUndo, initialWorld, planRotation, planUndo } from "@/domain/engine.ts";
import { STEP_DELAY_MS } from "@/domain/secrets.ts";
import type { LabStep, Plan, World } from "@/domain/types.ts";

type PlayMode = "rotate" | "undo";

interface IdleRun {
  kind: "idle";
}

interface PlayRun {
  kind: "play";
  mode: PlayMode;
  plan: Plan;
  prior: Plan | null;
  cursor: number;
  revealed: number;
  playing: boolean;
  finished: boolean;
}

type Run = IdleRun | PlayRun;

const IDLE_WORLD = initialWorld();

function combined(run: PlayRun): LabStep[] {
  return [...(run.prior?.steps ?? []), ...run.plan.steps];
}

function lengthOf(run: PlayRun): number {
  return (run.prior?.steps.length ?? 0) + run.plan.steps.length;
}

function worldAt(run: Run): World {
  if (run.kind === "idle" || run.cursor <= 0) {
    return IDLE_WORLD;
  }
  const priorLength = run.prior?.steps.length ?? 0;
  if (run.prior && run.cursor <= priorLength) {
    return run.prior.frames[run.cursor - 1] ?? IDLE_WORLD;
  }
  const index = run.cursor - priorLength - 1;
  return run.plan.frames[index] ?? run.prior?.frames[run.prior.frames.length - 1] ?? IDLE_WORLD;
}

function statusFor(run: Run, world: World): string {
  if (run.kind === "idle") {
    return "Idle. Every mock target holds the old fake key.";
  }
  if (run.playing && run.mode === "rotate") {
    return "Rotating shop.openai. This path does not call OpenAI, 1Password, Vercel, Supabase, or GitHub.";
  }
  if (run.playing && run.mode === "undo") {
    return "Undoing. Previous value goes back everywhere, then the new issuer key is deleted.";
  }
  if (run.mode === "undo" && run.finished) {
    return "Rolled back. Targets hold the old fake key. The new issuer key is deleted.";
  }
  if (run.mode === "rotate" && run.finished && world.targets.vercel.phase === "deploy-failed") {
    return "Forward redeploy failed. Revoke was not run. Undo puts the old key back.";
  }
  if (run.mode === "rotate" && run.finished) {
    return "Rotated. The old key stays in the vault until revoke. Undo is available.";
  }
  return "Paused. Select a step or resume.";
}

export function usePlanPlayer() {
  const [failDeploy, setFailDeploy] = useState(false);
  const [realCli, setRealCli] = useState(false);
  const [run, setRun] = useState<Run>({ kind: "idle" });

  const playing = run.kind === "play" && run.playing;

  useEffect(() => {
    if (!playing) {
      return;
    }
    const timer = window.setInterval(() => {
      setRun((current) => {
        if (current.kind !== "play" || !current.playing) {
          return current;
        }
        const length = lengthOf(current);
        if (current.cursor >= length) {
          return { ...current, playing: false, finished: true };
        }
        const nextCursor = current.cursor + 1;
        const done = nextCursor >= length;
        return {
          ...current,
          cursor: nextCursor,
          revealed: Math.max(current.revealed, nextCursor),
          playing: !done,
          finished: done,
        };
      });
    }, STEP_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  const world = worldAt(run);
  const steps = run.kind === "play" ? combined(run).slice(0, run.revealed) : [];
  const cursor = run.kind === "play" ? run.cursor : 0;
  const active = steps[cursor - 1] ?? null;
  const rotationFinished = run.kind === "play" && run.mode === "rotate" && run.finished;
  const finalRotation = rotationFinished ? run.plan.frames[run.plan.frames.length - 1] : undefined;
  const undoEnabled = Boolean(finalRotation && canUndo(finalRotation) && !playing);

  function rotate() {
    const plan = planRotation({ vercelRedeployFails: failDeploy });
    setRun({
      kind: "play",
      mode: "rotate",
      plan,
      prior: null,
      cursor: 1,
      revealed: 1,
      playing: true,
      finished: plan.steps.length <= 1,
    });
  }

  function undo() {
    setRun((current) => {
      if (current.kind !== "play" || current.mode !== "rotate" || !current.finished || current.playing) {
        return current;
      }
      const finalWorld = current.plan.frames[current.plan.frames.length - 1];
      if (!finalWorld || !canUndo(finalWorld)) {
        return current;
      }
      const undoPlan = planUndo(finalWorld);
      return {
        kind: "play",
        mode: "undo",
        plan: undoPlan,
        prior: current.plan,
        cursor: current.plan.steps.length + 1,
        revealed: current.plan.steps.length + 1,
        playing: true,
        finished: false,
      };
    });
  }

  function reset() {
    setRun({ kind: "idle" });
  }

  function pause() {
    setRun((current) => (current.kind === "play" ? { ...current, playing: false } : current));
  }

  function resume() {
    setRun((current) => {
      if (current.kind !== "play" || current.playing) {
        return current;
      }
      if (current.cursor >= lengthOf(current)) {
        return { ...current, playing: false, finished: true };
      }
      return { ...current, playing: true, cursor: current.revealed };
    });
  }

  function select(next: number) {
    setRun((current) => {
      if (current.kind !== "play") {
        return current;
      }
      const nextCursor = Math.min(Math.max(next, 1), current.revealed);
      return { ...current, cursor: nextCursor, playing: false };
    });
  }

  return {
    failDeploy,
    setFailDeploy,
    realCli,
    setRealCli,
    playing,
    world,
    steps,
    cursor,
    active,
    status: statusFor(run, world),
    undoEnabled,
    canResume: run.kind === "play" && !run.playing && !run.finished && run.cursor < lengthOf(run),
    rotate,
    undo,
    reset,
    pause,
    resume,
    select,
  };
}
