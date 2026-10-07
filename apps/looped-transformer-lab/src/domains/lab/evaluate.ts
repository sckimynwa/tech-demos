import {
  ADD_MAX_VALUE,
  EVAL_ADDITION_N,
  EVAL_SEED,
  MAX_LOOPS,
  MIN_LOOPS,
} from "./constants";
import { additionExactAt, makeAddition } from "./addition";
import { mulberry32 } from "./math";
import { MAZES, mazeExactAt } from "./maze";
import {
  blockParamCount,
  flopsForLoops,
  measureKernelMs,
  taskSeqLen,
  uniqueParamCount,
} from "./transformer";
import type { AdditionProblem, Metrics, SweepPoint, TaskId } from "./types";

function evalAdditionProblems(): AdditionProblem[] {
  const rng = mulberry32(EVAL_SEED);
  const curated: AdditionProblem[] = [
    makeAddition(123, 456),
    makeAddition(200, 300),
    makeAddition(129, 15),
    makeAddition(250, 150),
    makeAddition(999, 1),
    makeAddition(999, 999),
    makeAddition(500, 500),
    makeAddition(847, 286),
    makeAddition(199, 801),
    makeAddition(1, 999),
  ];
  const extra: AdditionProblem[] = [];
  while (curated.length + extra.length < EVAL_ADDITION_N) {
    extra.push(
      makeAddition(Math.floor(rng() * (ADD_MAX_VALUE + 1)), Math.floor(rng() * (ADD_MAX_VALUE + 1))),
    );
  }
  return [...curated, ...extra];
}

const ADD_BENCH = evalAdditionProblems();

export function scoreTask(task: TaskId, loops: number): { exactCorrect: number; total: number; accuracy: number } {
  let exactCorrect = 0;
  let total = 0;
  if (task === "addition") {
    total = ADD_BENCH.length;
    for (const problem of ADD_BENCH) {
      if (additionExactAt(problem, loops)) exactCorrect += 1;
    }
  } else {
    total = MAZES.length;
    for (const maze of MAZES) {
      if (mazeExactAt(maze, loops)) exactCorrect += 1;
    }
  }
  return { exactCorrect, total, accuracy: total === 0 ? 0 : exactCorrect / total };
}

export function evaluateTask(task: TaskId, loops: number, timed = false): Metrics {
  const scored = scoreTask(task, loops);
  const seqLen = taskSeqLen(task);
  return {
    ...scored,
    latencyMs: timed ? measureKernelMs(seqLen, loops) : 0,
    flops: flopsForLoops(seqLen, loops),
    uniqueParams: uniqueParamCount(),
    effectiveDepth: loops,
    unrolledParams: uniqueParamCount() - blockParamCount() + blockParamCount() * loops,
  };
}

export function sweepTask(task: TaskId): SweepPoint[] {
  const points: SweepPoint[] = [];
  for (let loops = MIN_LOOPS; loops <= MAX_LOOPS; loops += 1) {
    const scored = scoreTask(task, loops);
    points.push({
      loops,
      accuracy: scored.accuracy,
      latencyMs: 0,
      flops: flopsForLoops(taskSeqLen(task), loops),
    });
  }
  return points;
}

export function plainMetrics(task: TaskId, timed = false): Metrics {
  return evaluateTask(task, 1, timed);
}
