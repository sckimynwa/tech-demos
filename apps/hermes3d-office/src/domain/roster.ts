import type { AgentRuntime, AgentState, Team, TeamId } from "./types";

export const TEAMS: Record<TeamId, Team> = {
  product: { id: "product", label: "1HQ Product", color: "#d97706", rug: "#b45309" },
  growth: { id: "growth", label: "Growth", color: "#0f766e", rug: "#0d9488" },
  ax: { id: "ax", label: "AX", color: "#7c3aed", rug: "#6d28d9" },
  global: { id: "global", label: "Global", color: "#0284c7", rug: "#0369a1" },
  corp: { id: "corp", label: "Corp", color: "#be123c", rug: "#9f1239" },
};

export type AgentSeed = {
  id: string;
  name: string;
  team: TeamId;
  role: string;
  seedState: AgentState;
  seedTask: string;
};

export const AGENT_SEEDS: AgentSeed[] = [
  { id: "hailey", name: "Hailey", team: "product", role: "PM", seedState: "working", seedTask: "Spec checkout experiment" },
  { id: "sol", name: "Sol", team: "product", role: "Eng", seedState: "reviewing", seedTask: "Review PR #214 flag wiring" },
  { id: "wade", name: "Wade", team: "product", role: "Design", seedState: "idle", seedTask: "Waiting on copy lock" },
  { id: "tachi", name: "tachi", team: "product", role: "Eng", seedState: "done", seedTask: "Shipped empty-state polish" },
  { id: "lucy", name: "Lucy", team: "growth", role: "Growth", seedState: "working", seedTask: "Write funnel instrumentation" },
  { id: "connor", name: "Connor", team: "growth", role: "Data", seedState: "reviewing", seedTask: "Check attribution join" },
  { id: "paul", name: "Paul", team: "growth", role: "Lifecycle", seedState: "idle", seedTask: "Draft win-back sequence" },
  { id: "leo", name: "Leo", team: "ax", role: "AX", seedState: "working", seedTask: "Build agent eval harness" },
  { id: "june", name: "June", team: "ax", role: "AX", seedState: "done", seedTask: "Closed standup notes" },
  { id: "ahrin", name: "Ahrin", team: "ax", role: "Research", seedState: "reviewing", seedTask: "Review prompt regression" },
  { id: "yuna", name: "Yuna", team: "global", role: "Locale", seedState: "working", seedTask: "Ship KR locale pack" },
  { id: "evan", name: "Evan", team: "corp", role: "Ops", seedState: "idle", seedTask: "Queue vendor review" },
  { id: "ellie", name: "ellie", team: "corp", role: "People", seedState: "done", seedTask: "Posted weekly digest" },
];

export const LOG_LIMIT = 12;

export const placeForState = (state: AgentState) => {
  if (state === "reviewing") return "review" as const;
  if (state === "done") return "meeting" as const;
  return "desk" as const;
};

export const seedAgents = (): Record<string, AgentRuntime> => {
  const now = Date.now();
  const agents: Record<string, AgentRuntime> = {};
  for (const seed of AGENT_SEEDS) {
    const event = {
      type: "agent.state" as const,
      agentId: seed.id,
      state: seed.seedState,
      task: seed.seedTask,
      at: now,
    };
    agents[seed.id] = {
      id: seed.id,
      name: seed.name,
      team: seed.team,
      role: seed.role,
      color: TEAMS[seed.team].color,
      state: seed.seedState,
      place: placeForState(seed.seedState),
      task: seed.seedTask,
      log: [event],
    };
  }
  return agents;
};
