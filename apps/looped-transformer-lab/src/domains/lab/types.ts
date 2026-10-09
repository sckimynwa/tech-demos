export type TaskId = "addition" | "maze";

export type Metrics = {
  accuracy: number;
  exactCorrect: number;
  total: number;
  latencyMs: number;
  flops: number;
  uniqueParams: number;
  effectiveDepth: number;
  unrolledParams: number;
};

export type SweepPoint = {
  loops: number;
  accuracy: number;
  latencyMs: number;
  flops: number;
};

export type DigitCell = {
  value: number;
  target: number;
  confidence: number;
  correct: boolean;
  resolved: boolean;
  carryIn: number;
  carryOut: number;
};

export type AdditionSnapshot = {
  loop: number;
  digits: DigitCell[];
  predicted: number;
  target: number;
  correct: boolean;
  attn: number[][];
};

export type AdditionProblem = {
  a: number;
  b: number;
  sum: number;
  digitsA: number[];
  digitsB: number[];
  digitsSum: number[];
};

export type AdditionTrace = {
  problem: AdditionProblem;
  snapshots: AdditionSnapshot[];
};

export type MazeCellKind = "empty" | "wall" | "start" | "goal";

export type MazeCoord = {
  r: number;
  c: number;
};

export type MazeSpec = {
  id: string;
  name: string;
  hint: string;
  grid: MazeCellKind[][];
  start: MazeCoord;
  goal: MazeCoord;
  path: MazeCoord[];
  distance: number;
};

export type MazeCellView = {
  r: number;
  c: number;
  kind: MazeCellKind;
  discoveredAt: number | null;
  onPath: boolean;
  isHead: boolean;
};

export type MazeSnapshot = {
  loop: number;
  cells: MazeCellView[][];
  reachedGoal: boolean;
  attn: number[][];
};

export type MazeTrace = {
  maze: MazeSpec;
  snapshots: MazeSnapshot[];
};
