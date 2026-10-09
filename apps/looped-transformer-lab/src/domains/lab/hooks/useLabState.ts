import { useEffect, useMemo, useState } from "react";
import { ADD_MAX_VALUE, DEFAULT_LOOPS } from "../constants";
import { makeAddition, runAdditionLoops } from "../addition";
import { evaluateTask, sweepTask } from "../evaluate";
import { MAZES, mazeById, runMazeLoops } from "../maze";
import { ADDITION_PRESETS } from "../presets";
import { measureKernelMs, taskSeqLen } from "../transformer";
import type { TaskId } from "../types";

export function useLabState() {
  const [task, setTask] = useState<TaskId>("addition");
  const [loops, setLoops] = useState(DEFAULT_LOOPS);
  const [presetId, setPresetId] = useState(ADDITION_PRESETS[2]!.id);
  const [a, setA] = useState(999);
  const [b, setB] = useState(1);
  const [mazeId, setMazeId] = useState(MAZES[2]!.id);
  const [latencyMs, setLatencyMs] = useState(0);
  const [plainLatencyMs, setPlainLatencyMs] = useState(0);

  const problem = useMemo(() => makeAddition(a, b), [a, b]);
  const maze = useMemo(() => mazeById(mazeId), [mazeId]);

  const additionTrace = useMemo(() => runAdditionLoops(problem, loops), [problem, loops]);
  const plainAddition = useMemo(() => runAdditionLoops(problem, 1), [problem]);
  const mazeTrace = useMemo(() => runMazeLoops(maze, loops), [maze, loops]);
  const plainMaze = useMemo(() => runMazeLoops(maze, 1), [maze]);

  const loopedMetrics = useMemo(() => evaluateTask(task, loops), [task, loops]);
  const baselineMetrics = useMemo(() => evaluateTask(task, 1), [task]);
  const sweep = useMemo(() => sweepTask(task), [task]);

  useEffect(() => {
    const seqLen = taskSeqLen(task);
    const handle = window.requestAnimationFrame(() => {
      setLatencyMs(measureKernelMs(seqLen, loops));
      setPlainLatencyMs(measureKernelMs(seqLen, 1));
    });
    return () => window.cancelAnimationFrame(handle);
  }, [task, loops]);

  function applyPreset(id: string) {
    const preset = ADDITION_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setA(preset.problem.a);
    setB(preset.problem.b);
  }

  function setOperand(which: "a" | "b", raw: string) {
    const next = Math.max(0, Math.min(ADD_MAX_VALUE, Number.parseInt(raw, 10) || 0));
    setPresetId("custom");
    if (which === "a") setA(next);
    else setB(next);
  }

  function randomize() {
    setPresetId("custom");
    setA(Math.floor(Math.random() * (ADD_MAX_VALUE + 1)));
    setB(Math.floor(Math.random() * (ADD_MAX_VALUE + 1)));
  }

  return {
    task,
    setTask,
    loops,
    setLoops,
    presetId,
    applyPreset,
    a,
    b,
    setOperand,
    randomize,
    mazeId,
    setMazeId,
    maze,
    problem,
    additionTrace,
    plainAddition,
    mazeTrace,
    plainMaze,
    loopedMetrics: { ...loopedMetrics, latencyMs },
    baselineMetrics: { ...baselineMetrics, latencyMs: plainLatencyMs },
    sweep,
  };
}
