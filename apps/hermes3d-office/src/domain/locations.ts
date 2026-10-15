import type { Place, TeamId, Vec2 } from "./types";

export const OFFICE = {
  width: 24,
  depth: 18,
  wallHeight: 3.2,
  wallThickness: 0.18,
} as const;

export const DESKS: Record<string, Vec2> = {
  hailey: { x: -8.2, z: 4.6, facing: 0 },
  sol: { x: -5.6, z: 4.6, facing: 0 },
  wade: { x: -8.2, z: 6.8, facing: Math.PI },
  tachi: { x: -5.6, z: 6.8, facing: Math.PI },
  lucy: { x: -8.2, z: -4.4, facing: 0 },
  connor: { x: -5.6, z: -4.4, facing: 0 },
  paul: { x: -6.9, z: -6.6, facing: Math.PI },
  leo: { x: 5.6, z: 4.6, facing: 0 },
  june: { x: 8.2, z: 4.6, facing: 0 },
  ahrin: { x: 6.9, z: 6.8, facing: Math.PI },
  yuna: { x: 8.4, z: 0.6, facing: -Math.PI / 2 },
  evan: { x: 5.6, z: -4.6, facing: 0 },
  ellie: { x: 8.2, z: -4.6, facing: 0 },
};

export const TEAM_PODS: Record<
  TeamId,
  { x: number; z: number; w: number; d: number }
> = {
  product: { x: -6.9, z: 5.7, w: 5.4, d: 4.2 },
  growth: { x: -6.9, z: -5.5, w: 5.4, d: 4.2 },
  ax: { x: 6.9, z: 5.7, w: 5.4, d: 4.2 },
  global: { x: 8.4, z: 0.6, w: 3.2, d: 2.6 },
  corp: { x: 6.9, z: -5.6, w: 5.4, d: 3.4 },
};

export const MEETING_SLOTS: Vec2[] = [
  { x: -1.55, z: 0.15, facing: Math.PI / 2 },
  { x: 1.55, z: 0.15, facing: -Math.PI / 2 },
  { x: 0, z: -1.55, facing: 0 },
  { x: 0, z: 1.55, facing: Math.PI },
  { x: -1.15, z: -1.15, facing: Math.PI / 4 },
  { x: 1.15, z: -1.15, facing: -Math.PI / 4 },
  { x: -1.15, z: 1.15, facing: (3 * Math.PI) / 4 },
  { x: 1.15, z: 1.15, facing: (-3 * Math.PI) / 4 },
];

export const REVIEW_SLOTS: Vec2[] = [
  { x: -1.2, z: -7.05, facing: Math.PI },
  { x: 0.4, z: -7.05, facing: Math.PI },
  { x: 1.8, z: -7.05, facing: Math.PI },
  { x: -2.4, z: -6.35, facing: Math.PI * 0.85 },
];

export const MEETING_CENTER = { x: 0, z: 0.15 };
export const REVIEW_CENTER = { x: 0.2, z: -6.9 };

export const resolveDestination = (
  agentId: string,
  place: Place,
  occupants: string[],
): Vec2 => {
  if (place === "desk") {
    return DESKS[agentId] ?? { x: 0, z: 0, facing: 0 };
  }
  const slots = place === "meeting" ? MEETING_SLOTS : REVIEW_SLOTS;
  const index = Math.max(0, occupants.indexOf(agentId));
  return slots[index % slots.length] ?? slots[0];
};

export const occupantsAt = (
  agents: Record<string, { id: string; place: Place }>,
  place: Place,
): string[] =>
  Object.values(agents)
    .filter((agent) => agent.place === place)
    .map((agent) => agent.id)
    .sort();
