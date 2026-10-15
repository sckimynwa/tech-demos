import { describe, expect, test } from "bun:test";
import { MAZES, mazeExactAt, runMazeLoops } from "./maze";

describe("maze recurrent depth", () => {
  test("preset distances are 3/4/6/8", () => {
    expect(MAZES.map((maze) => maze.distance)).toEqual([3, 4, 6, 8]);
  });

  test("goal is unreachable until loop == distance", () => {
    for (const maze of MAZES) {
      expect(mazeExactAt(maze, maze.distance - 1)).toBe(false);
      expect(mazeExactAt(maze, maze.distance)).toBe(true);
      const trace = runMazeLoops(maze, maze.distance);
      expect(trace.snapshots[maze.distance - 1]?.reachedGoal).toBe(true);
      expect(trace.snapshots[0]?.reachedGoal).toBe(maze.distance <= 1);
    }
  });

  test("BFS wavefront discovers the goal cell on the last needed loop", () => {
    const snake = MAZES.find((maze) => maze.id === "snake")!;
    const trace = runMazeLoops(snake, 8);
    const goal = snake.goal;
    const last = trace.snapshots[7]!.cells[goal.r]![goal.c]!;
    expect(last.discoveredAt).toBe(8);
    expect(last.onPath).toBe(true);
  });
});
