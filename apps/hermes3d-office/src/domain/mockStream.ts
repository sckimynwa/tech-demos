import { AGENT_SEEDS } from "./roster";
import type { AgentState, OfficeEvent, TeamId } from "./types";

export const EVENT_TICK_MS = 2400;

const TASKS: Record<TeamId, Record<AgentState, string[]>> = {
  product: {
    idle: ["Parked on copy lock", "Waiting for design QA", "Inbox skim"],
    working: [
      "Draft experiment brief",
      "Implement checkout flag",
      "Write fixture for empty cart",
    ],
    reviewing: [
      "Review PR #214 flag wiring",
      "Check type errors on pricing",
      "QA the paywall path",
    ],
    done: [
      "Shipped empty-state polish",
      "Merged hotfix",
      "Closed spec comments",
    ],
  },
  growth: {
    idle: ["Waiting on pixel approval", "Coffee + dashboards"],
    working: [
      "Write funnel instrumentation",
      "Tune onboarding copy",
      "Build cohort query",
    ],
    reviewing: [
      "Check attribution join",
      "Review lifecycle PR",
      "QA invite loop",
    ],
    done: ["Shipped referral chip", "Closed win-back draft"],
  },
  ax: {
    idle: ["Waiting on eval set", "Reading last run"],
    working: [
      "Build agent eval harness",
      "Tighten tool-call prompt",
      "Label failure traces",
    ],
    reviewing: [
      "Review prompt regression",
      "Diff eval vs last week",
      "Check tool schema drift",
    ],
    done: ["Closed standup notes", "Landed eval snapshot"],
  },
  global: {
    idle: ["Waiting on legal strings"],
    working: ["Ship KR locale pack", "Fix date formats", "Sync glossary"],
    reviewing: ["Review EN→KR diffs", "QA locale fallback"],
    done: ["Published locale pack"],
  },
  corp: {
    idle: ["Queue vendor review", "Calendar triage"],
    working: ["Draft weekly digest", "Update access list", "Prep all-hands"],
    reviewing: ["Review policy diff", "Check expense notes"],
    done: ["Posted weekly digest", "Closed vendor ping"],
  },
};

const pick = <T,>(items: T[], exclude?: T): T => {
  const pool = exclude ? items.filter((item) => item !== exclude) : items;
  const source = pool.length > 0 ? pool : items;
  return source[Math.floor(Math.random() * source.length)] ?? items[0];
};

export const nextMockEvent = (
  agents: Record<string, { id: string; team: TeamId; state: AgentState }>,
  now = Date.now(),
): OfficeEvent => {
  const roster = Object.values(agents);
  const agent = pick(roster);
  const seed = AGENT_SEEDS.find((row) => row.id === agent.id);
  const team = seed?.team ?? agent.team;
  const state = pick(
    ["idle", "working", "reviewing", "done"] as AgentState[],
    agent.state,
  );
  const task = pick(TASKS[team][state]);
  return {
    type: "agent.state",
    agentId: agent.id,
    state,
    task,
    at: now,
  };
};
