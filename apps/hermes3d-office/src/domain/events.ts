import { LOG_LIMIT, placeForState } from "./roster";
import { AGENT_STATES, type AgentRuntime, type OfficeEvent } from "./types";

export const isOfficeEvent = (value: unknown): value is OfficeEvent => {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<OfficeEvent>;
  return (
    event.type === "agent.state" &&
    typeof event.agentId === "string" &&
    typeof event.task === "string" &&
    typeof event.at === "number" &&
    typeof event.state === "string" &&
    AGENT_STATES.includes(event.state)
  );
};

export const applyOfficeEvent = (
  agents: Record<string, AgentRuntime>,
  event: OfficeEvent,
): Record<string, AgentRuntime> => {
  const agent = agents[event.agentId];
  if (!agent) return agents;
  return {
    ...agents,
    [event.agentId]: {
      ...agent,
      state: event.state,
      place: placeForState(event.state),
      task: event.task,
      log: [event, ...agent.log].slice(0, LOG_LIMIT),
    },
  };
};
