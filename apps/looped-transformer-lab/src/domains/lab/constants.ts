export const MIN_LOOPS = 1;
export const MAX_LOOPS = 8;
export const DEFAULT_LOOPS = 4;

export const D_MODEL = 48;
export const N_HEADS = 4;
export const D_HEAD = D_MODEL / N_HEADS;
export const D_FF = 96;

export const ADD_OPERAND_DIGITS = 3;
export const ADD_ANSWER_DIGITS = 4;
export const ADD_MAX_VALUE = 999;
export const ADD_SEQ_LEN = ADD_OPERAND_DIGITS * 2 + ADD_ANSWER_DIGITS + 2;

export const MAZE_SIZE = 5;

export const EVAL_ADDITION_N = 80;
export const EVAL_SEED = 2107443395;
export const BENCH_REPEATS = 16;

export const TOKEN = {
  DIGIT0: 0,
  PLUS: 10,
  EQ: 11,
  PAD: 12,
} as const;

export const VOCAB_SIZE = 13;
