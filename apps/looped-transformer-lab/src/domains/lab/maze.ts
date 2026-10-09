import { MAZE_SIZE } from "./constants";
import type {
  MazeCellKind,
  MazeCellView,
  MazeCoord,
  MazeSnapshot,
  MazeSpec,
  MazeTrace,
} from "./types";

const DIRS: MazeCoord[] = [
  { r: -1, c: 0 },
  { r: 1, c: 0 },
  { r: 0, c: -1 },
  { r: 0, c: 1 },
];

function parseGrid(rows: string[]): MazeCellKind[][] {
  return rows.map((row) =>
    row.split("").map((ch) => {
      if (ch === "#") return "wall";
      if (ch === "S") return "start";
      if (ch === "G") return "goal";
      return "empty";
    }),
  );
}

function findKind(grid: MazeCellKind[][], kind: MazeCellKind): MazeCoord {
  for (let r = 0; r < grid.length; r += 1) {
    for (let c = 0; c < grid[r]!.length; c += 1) {
      if (grid[r]![c] === kind) return { r, c };
    }
  }
  throw new Error(`missing ${kind}`);
}

function key(coord: MazeCoord): string {
  return `${coord.r},${coord.c}`;
}

function shortestPath(grid: MazeCellKind[][], start: MazeCoord, goal: MazeCoord): MazeCoord[] {
  const q: MazeCoord[] = [start];
  const prev = new Map<string, string | null>([[key(start), null]]);
  while (q.length > 0) {
    const cur = q.shift()!;
    if (cur.r === goal.r && cur.c === goal.c) break;
    for (const dir of DIRS) {
      const next = { r: cur.r + dir.r, c: cur.c + dir.c };
      if (next.r < 0 || next.c < 0 || next.r >= MAZE_SIZE || next.c >= MAZE_SIZE) continue;
      if (grid[next.r]![next.c] === "wall") continue;
      if (prev.has(key(next))) continue;
      prev.set(key(next), key(cur));
      q.push(next);
    }
  }
  const path: MazeCoord[] = [];
  let cursor: string | null = key(goal);
  while (cursor) {
    const [r, c] = cursor.split(",").map(Number);
    path.push({ r: r!, c: c! });
    cursor = prev.get(cursor) ?? null;
  }
  return path.reverse();
}

function buildMaze(id: string, name: string, hint: string, rows: string[]): MazeSpec {
  const grid = parseGrid(rows);
  const start = findKind(grid, "start");
  const goal = findKind(grid, "goal");
  const path = shortestPath(grid, start, goal);
  return { id, name, hint, grid, start, goal, path, distance: path.length - 1 };
}

export const MAZES: MazeSpec[] = [
  buildMaze("dash", "Dash", "Distance 3 — three loops to the goal", [
    "S.#..",
    "..G..",
    "#####",
    "#####",
    "#####",
  ]),
  buildMaze("hall", "Hallway", "Distance 4 — four loops to the goal", [
    "S...G",
    "#####",
    "#####",
    "#####",
    "#####",
  ]),
  buildMaze("ell", "L-bend", "Distance 6 — needs more than a single pass", [
    "S####",
    ".....",
    "####G",
    "#####",
    "#####",
  ]),
  buildMaze("snake", "Snake", "Distance 8 — uses the full loop budget", [
    "S####",
    ".####",
    ".####",
    ".####",
    "....G",
  ]),
];

export function mazeById(id: string): MazeSpec {
  return MAZES.find((maze) => maze.id === id) ?? MAZES[0]!;
}

function bfsDiscovery(maze: MazeSpec): Map<string, number> {
  const discovered = new Map<string, number>([[key(maze.start), 0]]);
  const q: MazeCoord[] = [maze.start];
  while (q.length > 0) {
    const cur = q.shift()!;
    const dist = discovered.get(key(cur))!;
    for (const dir of DIRS) {
      const next = { r: cur.r + dir.r, c: cur.c + dir.c };
      if (next.r < 0 || next.c < 0 || next.r >= MAZE_SIZE || next.c >= MAZE_SIZE) continue;
      if (maze.grid[next.r]![next.c] === "wall") continue;
      if (discovered.has(key(next))) continue;
      discovered.set(key(next), dist + 1);
      q.push(next);
    }
  }
  return discovered;
}

function mazeAttention(maze: MazeSpec, loop: number): number[][] {
  const n = MAZE_SIZE * MAZE_SIZE;
  const attn = Array.from({ length: n }, () => Array.from({ length: n }, () => 1 / n));
  const discovered = bfsDiscovery(maze);
  for (let r = 0; r < MAZE_SIZE; r += 1) {
    for (let c = 0; c < MAZE_SIZE; c += 1) {
      const i = r * MAZE_SIZE + c;
      const dist = discovered.get(key({ r, c }));
      if (dist === undefined || dist > loop) continue;
      const row = attn[i]!;
      for (let k = 0; k < n; k += 1) row[k] = 0.01;
      for (const dir of DIRS) {
        const nr = r + dir.r;
        const nc = c + dir.c;
        if (nr < 0 || nc < 0 || nr >= MAZE_SIZE || nc >= MAZE_SIZE) continue;
        row[nr * MAZE_SIZE + nc] = 0.22;
      }
      row[i] = 0.3;
      const sum = row.reduce((acc, v) => acc + v, 0);
      for (let k = 0; k < n; k += 1) row[k]! /= sum;
    }
  }
  return attn;
}

export function runMazeLoops(maze: MazeSpec, loops: number): MazeTrace {
  const discovered = bfsDiscovery(maze);
  const snapshots: MazeSnapshot[] = [];
  const pathSet = new Set(maze.path.map(key));

  for (let loop = 1; loop <= loops; loop += 1) {
    const cells: MazeCellView[][] = maze.grid.map((row, r) =>
      row.map((kind, c) => {
        const dist = discovered.get(key({ r, c })) ?? null;
        const visible = dist !== null && dist <= loop;
        const onPath = visible && pathSet.has(key({ r, c })) && dist !== null && dist <= loop;
        return {
          r,
          c,
          kind,
          discoveredAt: visible ? dist : null,
          onPath,
          isHead: dist === loop && kind !== "wall",
        };
      }),
    );
    snapshots.push({
      loop,
      cells,
      reachedGoal: loop >= maze.distance,
      attn: mazeAttention(maze, loop),
    });
  }

  return { maze, snapshots };
}

export function mazeExactAt(maze: MazeSpec, loops: number): boolean {
  return loops >= maze.distance;
}
