import { makeAddition } from "./addition";
import type { AdditionProblem } from "./types";

export type AdditionPreset = {
  id: string;
  label: string;
  hint: string;
  problem: AdditionProblem;
};

export const ADDITION_PRESETS: AdditionPreset[] = [
  {
    id: "easy",
    label: "No carry",
    hint: "Local sums already match — loop 1 is enough",
    problem: makeAddition(123, 456),
  },
  {
    id: "one",
    label: "One carry",
    hint: "Ones overflow; tens need a second loop",
    problem: makeAddition(129, 15),
  },
  {
    id: "chain",
    label: "Carry chain",
    hint: "999+1 walks a 4-hop carry — the GPT-6.1 Sol story",
    problem: makeAddition(999, 1),
  },
  {
    id: "wide",
    label: "Two overflows",
    hint: "847+286 needs the thousands place",
    problem: makeAddition(847, 286),
  },
];
