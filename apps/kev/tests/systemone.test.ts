import { describe, expect, test } from "bun:test";
import { choiceConfidence, normalize, roundProb, scoreConfidence } from "../src/shared/systemone.ts";

describe("normalize", () => {
  test("divides by the sum", () => {
    expect(normalize([1, 1, 2])).toEqual([0.25, 0.25, 0.5]);
  });

  test("all zeros become uniform", () => {
    expect(normalize([0, 0, 0])).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  test("empty stays empty", () => {
    expect(normalize([])).toEqual([]);
  });
});

describe("choiceConfidence", () => {
  test("K=1 is 1", () => {
    expect(choiceConfidence([0.4])).toBe(1);
  });

  test("certainty is 1", () => {
    expect(choiceConfidence([1, 0, 0])).toBeCloseTo(1, 10);
  });

  test("uniform is 0", () => {
    expect(choiceConfidence([1, 1, 1])).toBeCloseTo(0, 10);
  });

  test("(p_max - 1/K) / (1 - 1/K) for README department example", () => {
    const p = [0.47, 0.28, 0.25];
    const k = 3;
    const expected = (Math.max(...normalize(p)) - 1 / k) / (1 - 1 / k);
    expect(choiceConfidence(p)).toBeCloseTo(expected, 10);
    expect(roundProb(choiceConfidence(p))).toBe(0.205);
  });
});

describe("scoreConfidence", () => {
  test("K=1 is 1", () => {
    expect(scoreConfidence([1])).toBe(1);
  });

  test("all mass on one level is 1", () => {
    expect(scoreConfidence([0, 0, 1])).toBeCloseTo(1, 10);
  });

  test("uniform is 0 (D = 2/3 for 3 levels)", () => {
    expect(scoreConfidence([1, 1, 1])).toBeCloseTo(0, 10);
  });

  test("README frustration-style spread uses D = 2/3", () => {
    const p = [0, 0.56, 0.44];
    const mode = 1;
    const expectedAbs = p.reduce((sum, pi, i) => sum + pi * Math.abs(i - mode), 0);
    const expected = Math.max(0, 1 - expectedAbs / (2 / 3));
    expect(scoreConfidence(p)).toBeCloseTo(expected, 10);
  });
});
