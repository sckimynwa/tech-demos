import { MOCK_TOKEN_INTERVAL_MS } from "../src/shared/constants";
import type { BookingEvent, BookingStrategy } from "../src/shared/protocol";
import { RESTAURANTS, SATURDAY_LABEL } from "./catalog";
import { writeSse } from "./sse";
import { executeTool, sleep, summarizeToolResult, toolLabel } from "./tools";

const CANDIDATES = RESTAURANTS.filter((restaurant) =>
  ["il-casaro", "zero-zero", "flour-water"].includes(restaurant.id),
);

const FINAL_COPY = [
  `Reserved Il Casaro Pizzeria for 4 on ${SATURDAY_LABEL} at 7:45 PM. `,
  "SoMa, Neapolitan, open 7:45 — closest to the ask and the only spot that is not a late-only pasta temple. ",
  "Confirmation CBR-ILC-4821. I skipped Flour + Water (one 8pm slot, Mission) and parked Zero Zero as backup at 8:30.",
].join("");

type PlannedTool = {
  name: string;
  args: Record<string, unknown>;
};

function searchPlan(): PlannedTool {
  return {
    name: "search_restaurants",
    args: { cuisine: "Italian", neighborhood: "SoMa", party_size: 4 },
  };
}

function inspectPlan(): PlannedTool[] {
  return CANDIDATES.flatMap((restaurant) => [
    {
      name: "check_availability",
      args: { restaurant_id: restaurant.id, date: "2026-10-10", party_size: 4 },
    },
    {
      name: "get_menu_highlights",
      args: { restaurant_id: restaurant.id },
    },
  ]);
}

function bookPlan(): PlannedTool {
  return {
    name: "book_table",
    args: {
      restaurant_id: "il-casaro",
      date: "2026-10-10",
      time: "7:45 PM",
      party_size: 4,
      name: "Demo Guest",
    },
  };
}

async function emitLlm(
  controller: ReadableStreamDefaultController<Uint8Array>,
  startedAt: number,
  id: string,
  label: string,
  thinkMs: number,
): Promise<void> {
  writeSse(controller, {
    type: "span_start",
    id,
    kind: "llm",
    name: "llm",
    label,
    startMs: Date.now() - startedAt,
  } satisfies BookingEvent);
  await sleep(thinkMs);
  writeSse(controller, {
    type: "span_end",
    id,
    endMs: Date.now() - startedAt,
    detail: "plan",
  } satisfies BookingEvent);
}

async function runTools(
  controller: ReadableStreamDefaultController<Uint8Array>,
  startedAt: number,
  tools: PlannedTool[],
  parallel: boolean,
): Promise<{ booked?: import("../src/shared/protocol").BookingResult }> {
  if (parallel) {
    const pending = tools.map(async (tool, index) => {
      const id = `${tool.name}-${index}-${Date.now()}`;
      writeSse(controller, {
        type: "span_start",
        id,
        kind: "tool",
        name: tool.name,
        label: toolLabel(tool.name, tool.args),
        startMs: Date.now() - startedAt,
      } satisfies BookingEvent);
      const executed = await executeTool(tool.name, tool.args);
      writeSse(controller, {
        type: "span_end",
        id,
        endMs: Date.now() - startedAt,
        detail: summarizeToolResult(tool.name, executed.result),
      } satisfies BookingEvent);
      return executed;
    });
    const results = await Promise.all(pending);
    return { booked: results.find((result) => result.booked)?.booked };
  }

  let booked: import("../src/shared/protocol").BookingResult | undefined;
  for (const [index, tool] of tools.entries()) {
    const id = `${tool.name}-${index}-${Date.now()}`;
    writeSse(controller, {
      type: "span_start",
      id,
      kind: "tool",
      name: tool.name,
      label: toolLabel(tool.name, tool.args),
      startMs: Date.now() - startedAt,
    } satisfies BookingEvent);
    const executed = await executeTool(tool.name, tool.args);
    writeSse(controller, {
      type: "span_end",
      id,
      endMs: Date.now() - startedAt,
      detail: summarizeToolResult(tool.name, executed.result),
    } satisfies BookingEvent);
    if (executed.booked) booked = executed.booked;
  }
  return { booked };
}

async function streamFinal(
  controller: ReadableStreamDefaultController<Uint8Array>,
  startedAt: number,
): Promise<void> {
  const id = `llm-final-${Date.now()}`;
  writeSse(controller, {
    type: "span_start",
    id,
    kind: "llm",
    name: "llm",
    label: "confirm",
    startMs: Date.now() - startedAt,
  } satisfies BookingEvent);

  for (const chunk of FINAL_COPY.match(/\S+\s*/g) ?? [FINAL_COPY]) {
    await sleep(MOCK_TOKEN_INTERVAL_MS);
    writeSse(controller, { type: "token", text: chunk } satisfies BookingEvent);
  }

  writeSse(controller, {
    type: "span_end",
    id,
    endMs: Date.now() - startedAt,
    detail: "confirmation",
  } satisfies BookingEvent);
}

export async function streamMockBooking(
  controller: ReadableStreamDefaultController<Uint8Array>,
  strategy: BookingStrategy,
): Promise<void> {
  const startedAt = Date.now();
  const parallel = strategy === "parallel";
  let toolCount = 0;
  let booked;

  writeSse(controller, {
    type: "meta",
    mode: "mock",
    parallel,
    model: "mock-cerebras-sim",
  } satisfies BookingEvent);

  await emitLlm(controller, startedAt, "llm-search", "plan search", 90);
  const search = await runTools(controller, startedAt, [searchPlan()], false);
  toolCount += 1;
  booked = search.booked ?? booked;

  if (parallel) {
    await emitLlm(controller, startedAt, "llm-inspect", "fan-out inspect", 70);
    const inspect = await runTools(controller, startedAt, inspectPlan(), true);
    toolCount += inspectPlan().length;
    booked = inspect.booked ?? booked;
  } else {
    for (const tool of inspectPlan()) {
      await emitLlm(controller, startedAt, `llm-${tool.name}-${toolCount}`, "next lookup", 55);
      const step = await runTools(controller, startedAt, [tool], false);
      toolCount += 1;
      booked = step.booked ?? booked;
    }
  }

  await emitLlm(controller, startedAt, "llm-book", "choose + book", 65);
  const reservation = await runTools(controller, startedAt, [bookPlan()], false);
  toolCount += 1;
  booked = reservation.booked ?? booked;

  await streamFinal(controller, startedAt);

  writeSse(controller, {
    type: "done",
    totalMs: Date.now() - startedAt,
    toolCount,
    booked,
  } satisfies BookingEvent);
}
