export const AGENT_STATES = ["idle", "working", "reviewing", "done"] as const;
export type AgentState = (typeof AGENT_STATES)[number];

export const PLACES = ["desk", "meeting", "review"] as const;
export type Place = (typeof PLACES)[number];

export const TEAM_IDS = [
  "product",
  "growth",
  "ax",
  "global",
  "corp",
] as const;
export type TeamId = (typeof TEAM_IDS)[number];

export type Team = {
  id: TeamId;
  label: string;
  color: string;
  rug: string;
};

export type OfficeEvent = {
  type: "agent.state";
  agentId: string;
  state: AgentState;
  task: string;
  at: number;
};

export type AgentRuntime = {
  id: string;
  name: string;
  team: TeamId;
  role: string;
  color: string;
  state: AgentState;
  place: Place;
  task: string;
  log: OfficeEvent[];
};

export type Vec2 = { x: number; z: number; facing: number };
