import {
  ADD_ANSWER_DIGITS,
  ADD_MAX_VALUE,
  ADD_OPERAND_DIGITS,
  ADD_SEQ_LEN,
} from "./constants";
import type { AdditionProblem, AdditionSnapshot, AdditionTrace, DigitCell } from "./types";

function padDigits(value: number, width: number): number[] {
  const clamped = Math.max(0, Math.min(value, 10 ** width - 1));
  return clamped
    .toString()
    .padStart(width, "0")
    .split("")
    .map((ch) => Number(ch));
}

export function makeAddition(a: number, b: number): AdditionProblem {
  const safeA = Math.max(0, Math.min(Math.floor(a), ADD_MAX_VALUE));
  const safeB = Math.max(0, Math.min(Math.floor(b), ADD_MAX_VALUE));
  const sum = safeA + safeB;
  return {
    a: safeA,
    b: safeB,
    sum,
    digitsA: padDigits(safeA, ADD_OPERAND_DIGITS),
    digitsB: padDigits(safeB, ADD_OPERAND_DIGITS),
    digitsSum: padDigits(sum, ADD_ANSWER_DIGITS),
  };
}

function operandAtPlace(digits: number[], placeFromOnes: number): number {
  const index = digits.length - 1 - placeFromOnes;
  return index >= 0 ? (digits[index] ?? 0) : 0;
}

function confidenceFor(placeFromOnes: number, loops: number, resolved: boolean): number {
  if (!resolved) return Math.min(0.62, 0.38 + 0.04 * loops);
  const extra = Math.max(0, loops - (placeFromOnes + 1));
  return Math.min(0.995, 0.84 + 0.04 * extra);
}

function attentionRow(placeFromOnes: number, loops: number): number[] {
  const row = Array.from({ length: ADD_SEQ_LEN }, () => 0.02);
  const aIdx = ADD_OPERAND_DIGITS - 1 - Math.min(placeFromOnes, ADD_OPERAND_DIGITS - 1);
  const bIdx = ADD_OPERAND_DIGITS + 1 + (ADD_OPERAND_DIGITS - 1 - Math.min(placeFromOnes, ADD_OPERAND_DIGITS - 1));
  const plusIdx = ADD_OPERAND_DIGITS;
  const eqIdx = ADD_OPERAND_DIGITS * 2 + 1;
  const prevAnswer = ADD_SEQ_LEN - 1 - (placeFromOnes - 1);
  row[aIdx] = 0.28;
  row[bIdx] = 0.28;
  row[plusIdx] = 0.08;
  row[eqIdx] = 0.06;
  if (placeFromOnes > 0 && prevAnswer >= eqIdx + 1) {
    row[prevAnswer] = 0.18 + 0.04 * Math.min(loops, 4);
  }
  if (placeFromOnes >= ADD_OPERAND_DIGITS) {
    row[eqIdx] = 0.16;
  }
  const sum = row.reduce((acc, v) => acc + v, 0);
  return row.map((v) => v / sum);
}

export function runAdditionLoops(problem: AdditionProblem, loops: number): AdditionTrace {
  const carryOut = Array.from({ length: ADD_ANSWER_DIGITS }, () => 0);
  const snapshots: AdditionSnapshot[] = [];

  for (let loop = 1; loop <= loops; loop += 1) {
    const prevCarry = carryOut.slice();
    const cells: DigitCell[] = [];

    for (let place = 0; place < ADD_ANSWER_DIGITS; place += 1) {
      const aDig = operandAtPlace(problem.digitsA, place);
      const bDig = operandAtPlace(problem.digitsB, place);
      const carryIn = place === 0 ? 0 : prevCarry[place - 1]!;
      const total = aDig + bDig + carryIn;
      const value = total % 10;
      const nextCarry = Math.floor(total / 10);
      carryOut[place] = nextCarry;
      const resolved = loop >= place + 1;
      const target = problem.digitsSum[ADD_ANSWER_DIGITS - 1 - place]!;
      cells.push({
        value,
        target,
        confidence: confidenceFor(place, loop, resolved),
        correct: value === target,
        resolved,
        carryIn,
        carryOut: nextCarry,
      });
    }

    const msdFirst = cells.slice().reverse();
    const predicted = Number(msdFirst.map((cell) => String(cell.value)).join(""));
    snapshots.push({
      loop,
      digits: msdFirst,
      predicted,
      target: problem.sum,
      correct: predicted === problem.sum,
      attn: msdFirst.map((_, idx) => attentionRow(ADD_ANSWER_DIGITS - 1 - idx, loop)),
    });
  }

  return { problem, snapshots };
}

export function additionExactAt(problem: AdditionProblem, loops: number): boolean {
  const trace = runAdditionLoops(problem, loops);
  return trace.snapshots[trace.snapshots.length - 1]?.correct ?? false;
}

export function loopsNeededForAddition(problem: AdditionProblem): number {
  let carry = 0;
  let needed = 1;
  for (let place = 0; place < ADD_ANSWER_DIGITS; place += 1) {
    const total =
      operandAtPlace(problem.digitsA, place) + operandAtPlace(problem.digitsB, place) + carry;
    const nextCarry = Math.floor(total / 10);
    if (nextCarry > 0) needed = place + 2;
    carry = nextCarry;
  }
  return Math.min(ADD_ANSWER_DIGITS, needed);
}
