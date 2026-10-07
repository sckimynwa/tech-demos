import { describe, expect, test } from "bun:test";
import { ADD_SEQ_LEN } from "./constants";
import { evaluateTask } from "./evaluate";
import { flopsForLoops, uniqueParamCount } from "./transformer";

describe("shared-block compute", () => {
  test("unique params are identical for looped and plain", () => {
    const looped = evaluateTask("addition", 8);
    const plain = evaluateTask("addition", 1);
    expect(looped.uniqueParams).toBe(plain.uniqueParams);
    expect(looped.uniqueParams).toBe(uniqueParamCount());
    expect(looped.effectiveDepth).toBe(8);
    expect(plain.effectiveDepth).toBe(1);
    expect(looped.unrolledParams).toBeGreaterThan(plain.unrolledParams);
  });

  test("FLOPs scale linearly with loops", () => {
    const one = flopsForLoops(ADD_SEQ_LEN, 1);
    const four = flopsForLoops(ADD_SEQ_LEN, 4);
    expect(four).toBe(one * 4);
  });

  test("addition accuracy rises with loops on the holdout mix", () => {
    const shallow = evaluateTask("addition", 1);
    const deep = evaluateTask("addition", 4);
    expect(deep.accuracy).toBeGreaterThan(shallow.accuracy);
    expect(deep.accuracy).toBe(1);
  });
});
