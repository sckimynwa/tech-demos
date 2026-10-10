import { describe, expect, test } from "bun:test";
import { applyOfficeEvent, isOfficeEvent } from "./events";
import { seedAgents } from "./roster";

describe("office events", () => {
  test("accepts the documented ingest shape", () => {
    expect(
      isOfficeEvent({
        type: "agent.state",
        agentId: "hailey",
        state: "reviewing",
        task: "Review PR #88",
        at: 1,
      }),
    ).toBe(true);
    expect(isOfficeEvent({ type: "nope" })).toBe(false);
  });

  test("moves reviewing agents to the review bay and prepends the log", () => {
    const next = applyOfficeEvent(seedAgents(), {
      type: "agent.state",
      agentId: "hailey",
      state: "reviewing",
      task: "Review PR #88",
      at: 99,
    });
    expect(next.hailey?.place).toBe("review");
    expect(next.hailey?.state).toBe("reviewing");
    expect(next.hailey?.log[0]?.task).toBe("Review PR #88");
  });

  test("sends done agents to the meeting table", () => {
    const next = applyOfficeEvent(seedAgents(), {
      type: "agent.state",
      agentId: "yuna",
      state: "done",
      task: "Published locale pack",
      at: 2,
    });
    expect(next.yuna?.place).toBe("meeting");
  });
});
