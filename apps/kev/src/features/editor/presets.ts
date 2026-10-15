import type { Question } from "@/shared/systemone";

export type DraftChoiceOption = { name: string; description: string };
export type DraftQuestion = {
  uid: string;
  id: string;
  type: Question["type"];
  instructions: string;
  noulTrue: string;
  noulFalse: string;
  choiceOptions: DraftChoiceOption[];
  scoreLevels: string[];
};

export type TicketPreset = {
  id: string;
  label: string;
  blurb: string;
  state: string;
};

export const DEFAULT_QUESTIONS: DraftQuestion[] = [
  {
    uid: "department",
    id: "department",
    type: "choice",
    instructions: "Which team should handle this?",
    noulTrue: "",
    noulFalse: "",
    choiceOptions: [
      { name: "returns", description: "Exchanges, refunds, wrong or damaged items" },
      { name: "shipping", description: "Delivery status, delays, lost packages" },
      { name: "billing", description: "Charges, invoices, payment problems" },
    ],
    scoreLevels: ["Calm", "Frustrated", "Very angry"],
  },
  {
    uid: "escalate",
    id: "escalate",
    type: "noul",
    instructions: "Does this need urgent human attention?",
    noulTrue: "",
    noulFalse: "",
    choiceOptions: [
      { name: "returns", description: "Exchanges, refunds, wrong or damaged items" },
      { name: "shipping", description: "Delivery status, delays, lost packages" },
      { name: "billing", description: "Charges, invoices, payment problems" },
    ],
    scoreLevels: ["Calm", "Frustrated", "Very angry"],
  },
  {
    uid: "frustration",
    id: "frustration",
    type: "score",
    instructions: "How frustrated is the customer?",
    noulTrue: "",
    noulFalse: "",
    choiceOptions: [
      { name: "returns", description: "Exchanges, refunds, wrong or damaged items" },
      { name: "shipping", description: "Delivery status, delays, lost packages" },
      { name: "billing", description: "Charges, invoices, payment problems" },
    ],
    scoreLevels: ["Calm", "Frustrated", "Very angry"],
  },
];

export const TICKET_PRESETS: TicketPreset[] = [
  {
    id: "charged-twice",
    label: "Charged twice",
    blurb: "Duplicate charge, wants it fixed ASAP.",
    state: "I was charged twice for order #4411. Please fix this ASAP.",
  },
  {
    id: "late-size-charge",
    label: "Late + wrong size + double charge",
    blurb: "The README example ticket.",
    state:
      "Shoes arrived two weeks late and in the wrong size. Also I see two charges on my card.",
  },
  {
    id: "password-reset",
    label: "Password reset",
    blurb: "Can't log in before a meeting.",
    state:
      "I can't log in. Please reset my password — I have a meeting in 10 minutes and I'm locked out of my account.",
  },
  {
    id: "angry-refund",
    label: "Angry refund",
    blurb: "Third attempt, wants a full refund now.",
    state:
      "This is the THIRD time. I want a FULL REFUND now or I'm calling my lawyer. Completely unacceptable.",
  },
];

export const DEFAULT_STATE = TICKET_PRESETS[1]!.state;

export function emptyQuestion(index: number): DraftQuestion {
  return {
    uid: crypto.randomUUID(),
    id: `q${index}`,
    type: "noul",
    instructions: "",
    noulTrue: "",
    noulFalse: "",
    choiceOptions: [
      { name: "a", description: "" },
      { name: "b", description: "" },
    ],
    scoreLevels: ["low", "medium", "high"],
  };
}

export function cloneDefaults(): DraftQuestion[] {
  return DEFAULT_QUESTIONS.map((q) => ({
    ...q,
    choiceOptions: q.choiceOptions.map((opt) => ({ ...opt })),
    scoreLevels: [...q.scoreLevels],
  }));
}
