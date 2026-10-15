import type { AgentState } from "../domain/types";

export const WALK_SPEED = 3.4;
export const ARRIVE_EPSILON = 0.06;
export const WALK_CYCLE = 9;

export const STATUS_COLOR: Record<AgentState, string> = {
  idle: "#94a3b8",
  working: "#f59e0b",
  reviewing: "#c4b5fd",
  done: "#34d399",
};

export const WOOD = "#8b5a2b";
export const WOOD_DARK = "#5c3d2e";
export const PLASTER = "#f4e7d4";
export const FLOOR = "#c9a36a";
export const TRIM = "#3f2a1d";
