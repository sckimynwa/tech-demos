import { describe, expect, test } from "bun:test";
import { additionExactAt, loopsNeededForAddition, makeAddition, runAdditionLoops } from "./addition";

describe("addition recurrent depth", () => {
  test("no-carry is exact at loop 1", () => {
    const problem = makeAddition(123, 456);
    expect(problem.sum).toBe(579);
    expect(additionExactAt(problem, 1)).toBe(true);
    expect(loopsNeededForAddition(problem)).toBe(1);
  });

  test("999+1 walks the full carry chain", () => {
    const problem = makeAddition(999, 1);
    const trace = runAdditionLoops(problem, 4);
    expect(trace.snapshots.map((snap) => snap.predicted)).toEqual([990, 900, 0, 1000]);
    expect(trace.snapshots[0]?.correct).toBe(false);
    expect(trace.snapshots[3]?.correct).toBe(true);
    expect(loopsNeededForAddition(problem)).toBe(4);
  });

  test("plain one-pass matches looped at L=1", () => {
    const problem = makeAddition(847, 286);
    const looped = runAdditionLoops(problem, 4);
    const plain = runAdditionLoops(problem, 1);
    expect(plain.snapshots[0]?.predicted).toBe(looped.snapshots[0]?.predicted);
    expect(plain.snapshots[0]?.predicted).not.toBe(problem.sum);
    expect(looped.snapshots[3]?.predicted).toBe(problem.sum);
  });

  test("each extra loop can absorb one more carry hop", () => {
    const problem = makeAddition(199, 801);
    expect(additionExactAt(problem, 1)).toBe(false);
    expect(additionExactAt(problem, loopsNeededForAddition(problem))).toBe(true);
  });
});
