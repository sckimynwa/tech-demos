export type JSONContent =
  | string
  | number
  | boolean
  | null
  | JSONContent[]
  | { [key: string]: JSONContent };

export type QuestionType = "noul" | "choice" | "score";

export type NoulQuestion = {
  type: "noul";
  instructions?: JSONContent;
  criteria?: { true?: JSONContent; false?: JSONContent };
};

export type ChoiceQuestion = {
  type: "choice";
  instructions?: JSONContent;
  criteria: Record<string, JSONContent>;
};

export type ScoreQuestion = {
  type: "score";
  instructions?: JSONContent;
  criteria: JSONContent[];
};

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type SystemOneRequest = {
  state: JSONContent;
  model: string;
  questions: Record<string, Question>;
};

export type NoulAnswer = { type: "noul"; noul: number };

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type ScoreAnswer = {
  type: "score";
  score: number;
  confidence: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
};

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type SystemOneResponse = {
  model: string;
  answers: Record<string, Answer>;
  usage: { input_tokens: number; output_tokens: number };
  latency_ms: number;
};

export type ApiConfig = {
  mode: "mock" | "live";
  model: string;
  baseUrlHost: string | null;
};

export const DEFAULT_MODEL = "kev-latest";
export const DEFAULT_THRESHOLD = 0.8;
export const ROUND_PROB_DECIMALS = 4;

export function renderContent(value: JSONContent | undefined): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => `- ${renderContent(item)}`).join("\n");
  }
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${renderContent(item)}`)
    .join("\n");
}

export function normalize(p: number[]): number[] {
  if (p.length === 0) return [];
  const total = p.reduce((sum, x) => sum + x, 0);
  if (total === 0) return p.map(() => 1 / p.length);
  return p.map((x) => x / total);
}

export function roundProb(x: number): number {
  const factor = 10 ** ROUND_PROB_DECIMALS;
  return Math.round(x * factor) / factor;
}

/** (p_max − 1/K) / (1 − 1/K). K=1 → 1. p is normalized first (zeros → uniform). */
export function choiceConfidence(p: number[]): number {
  const k = p.length;
  if (k === 0) return 0;
  if (k === 1) return 1;
  const pMax = Math.max(...normalize(p));
  return (pMax - 1 / k) / (1 - 1 / k);
}

/**
 * max(0, 1 − E|level − mode| / D)
 * D = mean distance of a uniform distribution over levels from its middle.
 * For 3 levels, D = 2/3.
 */
export function scoreConfidence(p: number[]): number {
  const levelCount = p.length;
  if (levelCount === 0) return 0;
  if (levelCount === 1) return 1;
  const normalized = normalize(p);
  const mode = normalized.reduce((best, value, index) => {
    return value > normalized[best]! ? index : best;
  }, 0);
  const middle = (levelCount - 1) / 2;
  const uniformMad =
    Array.from({ length: levelCount }, (_, i) => Math.abs(i - middle)).reduce((sum, d) => sum + d, 0) /
    levelCount;
  const expectedAbs = normalized.reduce((sum, pi, i) => sum + pi * Math.abs(i - mode), 0);
  return Math.max(0, 1 - expectedAbs / uniformMad);
}

export function questionKeys(question: Question): string[] {
  if (question.type === "choice") return Object.keys(question.criteria);
  if (question.type === "noul") return ["false", "true"];
  return question.criteria.map((_, i) => String(i));
}
