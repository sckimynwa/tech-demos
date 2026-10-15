import {
  type Answer,
  type ChoiceAnswer,
  type ChoiceQuestion,
  type JSONContent,
  type NoulAnswer,
  type Question,
  type ScoreAnswer,
  type ScoreQuestion,
  type SystemOneRequest,
  type SystemOneResponse,
  choiceConfidence,
  normalize,
  questionKeys,
  renderContent,
  roundProb,
  scoreConfidence,
} from "../src/shared/systemone.ts";

export const MOCK_LATENCY_MIN_MS = 300;
export const MOCK_LATENCY_MAX_MS = 600;

const BILLING_TERMS = ["charge", "charged", "charges", "invoice", "payment", "card", "billed", "twice", "double", "billing"];
const SHIPPING_TERMS = ["late", "delay", "delayed", "lost", "package", "delivery", "tracking", "weeks", "ship", "shipping"];
const RETURNS_TERMS = ["size", "wrong", "damaged", "exchange", "return", "returns", "refund", "shoes", "item"];
const ACCESS_TERMS = ["password", "login", "log in", "reset", "account", "locked", "sign in"];
const ESCALATE_TERMS = ["asap", "urgent", "angry", "furious", "lawyer", "lawsuit", "manager", "third", "unacceptable", "now", "immediately"];
const HIGH_FRUSTRATION = ["angry", "furious", "pissed", "unacceptable", "terrible", "lawyer", "third", "never"];
const MID_FRUSTRATION = ["late", "wait", "forgot", "frustrated", "wrong", "charged", "twice", "please"];

function hash32(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countHits(haystack: string, terms: string[]): number {
  return terms.reduce((n, term) => n + (haystack.includes(term) ? 1 : 0), 0);
}

function optionBias(state: string, name: string, description: string): number {
  const blob = `${name} ${description}`.toLowerCase();
  let score = 0.15;
  if (BILLING_TERMS.some((t) => blob.includes(t))) score += 0.9 * countHits(state, BILLING_TERMS);
  if (SHIPPING_TERMS.some((t) => blob.includes(t))) score += 0.9 * countHits(state, SHIPPING_TERMS);
  if (RETURNS_TERMS.some((t) => blob.includes(t))) score += 0.9 * countHits(state, RETURNS_TERMS);
  if (ACCESS_TERMS.some((t) => blob.includes(t))) score += 0.9 * countHits(state, ACCESS_TERMS);
  for (const token of blob.split(/[^a-z0-9]+/)) {
    if (token.length >= 4 && state.includes(token)) score += 0.35;
  }
  return score;
}

function softmaxLike(raw: number[], rand: () => number): number[] {
  const noisy = raw.map((x) => Math.max(1e-6, x + rand() * 0.35));
  const max = Math.max(...noisy);
  const exps = noisy.map((x) => Math.exp((x - max) * 1.15));
  return normalize(exps);
}

function estimateTokens(value: unknown): number {
  const text = JSON.stringify(value) ?? "";
  return Math.max(1, Math.round(text.length / 4));
}

function noulAnswer(state: string, question: Question, rand: () => number): NoulAnswer {
  const criteria = question.type === "noul" ? question.criteria ?? {} : {};
  const instr = renderContent(question.instructions).toLowerCase();
  const yesHint = `${renderContent(criteria.true)} ${instr}`;
  const noHint = renderContent(criteria.false);
  let yes = 0.28 + 0.22 * countHits(state, ESCALATE_TERMS) + 0.14 * countHits(state, HIGH_FRUSTRATION);
  if (yesHint.includes("urgent") || yesHint.includes("human") || yesHint.includes("escalat")) {
    yes += 0.08 * countHits(state, ESCALATE_TERMS);
  }
  if (noHint) yes -= 0.05;
  yes += (rand() - 0.5) * 0.12;
  const noul = roundProb(Math.min(0.99, Math.max(0.01, yes)));
  return { type: "noul", noul };
}

function choiceAnswer(state: string, question: ChoiceQuestion, rand: () => number): ChoiceAnswer {
  const keys = questionKeys(question);
  const raw = keys.map((key) => optionBias(state, key, renderContent(question.criteria[key])));
  const probabilities = softmaxLike(raw, rand);
  const winner = probabilities.reduce((best, value, index) => {
    return value > probabilities[best]! ? index : best;
  }, 0);
  const dist = Object.fromEntries(keys.map((key, i) => [key, roundProb(probabilities[i]!)]));
  return {
    type: "choice",
    choice: keys[winner]!,
    confidence: roundProb(choiceConfidence(probabilities)),
    probabilities: dist,
  };
}

function scoreAnswer(state: string, question: ScoreQuestion, rand: () => number): ScoreAnswer {
  const levels = question.criteria.map((level) => renderContent(level));
  const high = countHits(state, HIGH_FRUSTRATION) + countHits(state, ESCALATE_TERMS);
  const mid = countHits(state, MID_FRUSTRATION);
  const raw = levels.map((label, index) => {
    const t = index / Math.max(1, levels.length - 1);
    const labelBias = /angry|high|urgent|furious|5/.test(label.toLowerCase())
      ? high
      : /frustrat|normal|poor|3/.test(label.toLowerCase())
        ? mid
        : /calm|low|wait|1/.test(label.toLowerCase())
          ? Math.max(0.2, 1.2 - high - mid * 0.4)
          : 0.4;
    return 0.2 + labelBias + t * high * 0.55 + (1 - t) * Math.max(0.15, 1 - high * 0.4) + rand() * 0.2;
  });
  const probabilities = softmaxLike(raw, rand);
  const score = probabilities.reduce((sum, p, i) => sum + i * p, 0);
  const legend = Object.fromEntries(levels.map((label, i) => [String(i), label]));
  const dist = Object.fromEntries(probabilities.map((p, i) => [String(i), roundProb(p)]));
  return {
    type: "score",
    score: roundProb(score),
    confidence: roundProb(scoreConfidence(probabilities)),
    legend,
    probabilities: dist,
  };
}

export function validateRequest(body: unknown): { ok: true; request: SystemOneRequest } | { ok: false; status: number; message: string } {
  if (body == null || typeof body !== "object") {
    return { ok: false, status: 422, message: "Request body must be a JSON object" };
  }
  const rec = body as Record<string, unknown>;
  if (rec.state == null || (typeof rec.state === "string" && rec.state.trim() === "")) {
    return { ok: false, status: 422, message: "state is required and must not be empty" };
  }
  const rendered = renderContent(rec.state as JSONContent);
  if (rendered.length > 65_536) {
    return {
      ok: false,
      status: 422,
      message: `state is ${rendered.length} characters; limit is 65536 (Kev refuses rather than truncating)`,
    };
  }
  const questions = rec.questions;
  if (questions == null || typeof questions !== "object" || Array.isArray(questions)) {
    return { ok: false, status: 422, message: "questions must be a non-empty object" };
  }
  const entries = Object.entries(questions as Record<string, Question>);
  if (entries.length === 0) {
    return { ok: false, status: 422, message: "questions must contain at least one question" };
  }
  for (const [id, question] of entries) {
    if (!question || typeof question !== "object" || !("type" in question)) {
      return { ok: false, status: 422, message: `question '${id}' is missing a type` };
    }
    if (question.type === "choice") {
      const keys = Object.keys(question.criteria ?? {});
      if (keys.length < 1 || keys.length > 255) {
        return { ok: false, status: 422, message: `question '${id}' choice criteria must have 1..255 options` };
      }
    }
    if (question.type === "score") {
      const levels = question.criteria ?? [];
      if (!Array.isArray(levels) || levels.length < 1 || levels.length > 255) {
        return { ok: false, status: 422, message: `question '${id}' score criteria must be 1..255 ordered levels` };
      }
    }
    if (question.type !== "noul" && question.type !== "choice" && question.type !== "score") {
      return { ok: false, status: 422, message: `question '${id}' has unknown type` };
    }
  }
  return {
    ok: true,
    request: {
      state: rec.state as JSONContent,
      model: typeof rec.model === "string" && rec.model.trim() ? rec.model : "kev-latest",
      questions: questions as Record<string, Question>,
    },
  };
}

export function mockSystemOne(request: SystemOneRequest, latencyMs: number): SystemOneResponse {
  const state = renderContent(request.state).toLowerCase();
  const seed = hash32(`${state}\n${JSON.stringify(request.questions)}\n${request.model}`);
  const rand = mulberry32(seed);
  const answers: Record<string, Answer> = {};
  for (const [id, question] of Object.entries(request.questions)) {
    if (question.type === "noul") answers[id] = noulAnswer(state, question, rand);
    else if (question.type === "choice") answers[id] = choiceAnswer(state, question, rand);
    else answers[id] = scoreAnswer(state, question, rand);
  }
  return {
    model: request.model,
    answers,
    usage: {
      input_tokens: estimateTokens({ state: request.state, questions: request.questions }),
      output_tokens: estimateTokens(answers),
    },
    latency_ms: latencyMs,
  };
}

export function mockLatencyMs(request: SystemOneRequest): number {
  const seed = hash32(`${renderContent(request.state)}|${request.model}|latency`);
  return MOCK_LATENCY_MIN_MS + (seed % (MOCK_LATENCY_MAX_MS - MOCK_LATENCY_MIN_MS + 1));
}

export function mockRequestId(request: SystemOneRequest): string {
  const seed = hash32(`${renderContent(request.state)}|${JSON.stringify(request.questions)}|id`);
  return `mock-${seed.toString(16).padStart(8, "0")}`;
}
