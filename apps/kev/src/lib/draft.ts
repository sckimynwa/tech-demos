import { DEFAULT_MODEL, type Question, type SystemOneRequest } from "@/shared/systemone";
import { DEFAULT_STATE, type DraftQuestion, cloneDefaults } from "@/features/editor/presets";

export const STORAGE_KEY = "kev-playground-draft";

export type PersistedDraft = {
  state: string;
  model: string;
  questions: DraftQuestion[];
};

export function loadDraft(): PersistedDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (typeof parsed.state !== "string" || !Array.isArray(parsed.questions)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: PersistedDraft): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function questionsToWire(questions: DraftQuestion[]): Record<string, Question> {
  const out: Record<string, Question> = {};
  for (const q of questions) {
    const id = q.id.trim() || q.uid;
    if (q.type === "noul") {
      const criteria =
        q.noulTrue.trim() || q.noulFalse.trim()
          ? {
              ...(q.noulTrue.trim() ? { true: q.noulTrue } : {}),
              ...(q.noulFalse.trim() ? { false: q.noulFalse } : {}),
            }
          : undefined;
      out[id] = { type: "noul", instructions: q.instructions, ...(criteria ? { criteria } : {}) };
    } else if (q.type === "choice") {
      const criteria = Object.fromEntries(
        q.choiceOptions
          .filter((opt) => opt.name.trim())
          .map((opt) => [opt.name.trim(), opt.description.trim() ? opt.description : null]),
      );
      out[id] = { type: "choice", instructions: q.instructions, criteria };
    } else {
      out[id] = {
        type: "score",
        instructions: q.instructions,
        criteria: q.scoreLevels.map((level) => level.trim()).filter(Boolean),
      };
    }
  }
  return out;
}

export function buildRequest(state: string, model: string, questions: DraftQuestion[]): SystemOneRequest {
  return {
    state,
    model: model.trim() || DEFAULT_MODEL,
    questions: questionsToWire(questions),
  };
}

export function initialDraft(): PersistedDraft {
  const stored = loadDraft();
  return {
    state: stored?.state || DEFAULT_STATE,
    model: stored?.model || DEFAULT_MODEL,
    questions: stored?.questions?.length ? stored.questions : cloneDefaults(),
  };
}
