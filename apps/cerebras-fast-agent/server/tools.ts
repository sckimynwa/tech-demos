import { BOOK_LATENCY_MS, SEARCH_LATENCY_MS } from "../src/shared/constants";
import type { BookingResult } from "../src/shared/protocol";
import {
  SATURDAY_LABEL,
  findRestaurant,
  saturdayDateIso,
  searchRestaurants,
} from "./catalog";

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export const BOOKING_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_restaurants",
      description:
        "Search the local restaurant catalog by cuisine and neighborhood.",
      parameters: {
        type: "object",
        properties: {
          cuisine: { type: "string", description: "Cuisine, e.g. Italian" },
          neighborhood: {
            type: "string",
            description: "Neighborhood, e.g. SoMa",
          },
          party_size: { type: "number" },
        },
        required: ["cuisine", "neighborhood", "party_size"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check open table times for a restaurant on a date.",
      parameters: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          date: { type: "string", description: "ISO date YYYY-MM-DD" },
          party_size: { type: "number" },
        },
        required: ["restaurant_id", "date", "party_size"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_menu_highlights",
      description: "Fetch a short list of menu highlights and vibe notes.",
      parameters: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
        },
        required: ["restaurant_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_table",
      description: "Reserve a table and return a confirmation.",
      parameters: {
        type: "object",
        properties: {
          restaurant_id: { type: "string" },
          date: { type: "string" },
          time: { type: "string" },
          party_size: { type: "number" },
          name: { type: "string" },
        },
        required: ["restaurant_id", "date", "time", "party_size"],
        additionalProperties: false,
      },
    },
  },
] as const;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<{ result: unknown; booked?: BookingResult; latencyMs: number }> {
  if (name === "search_restaurants") {
    await sleep(SEARCH_LATENCY_MS);
    const matches = searchRestaurants({
      cuisine: asString(args.cuisine, "Italian"),
      neighborhood: asString(args.neighborhood, "SoMa"),
    }).map((restaurant) => ({
      id: restaurant.id,
      name: restaurant.name,
      neighborhood: restaurant.neighborhood,
      cuisine: restaurant.cuisine,
      price: restaurant.price,
      rating: restaurant.rating,
    }));
    return { result: { matches, date: saturdayDateIso() }, latencyMs: SEARCH_LATENCY_MS };
  }

  if (name === "check_availability") {
    const restaurant = findRestaurant(asString(args.restaurant_id));
    const latencyMs = restaurant?.availabilityLatencyMs ?? 500;
    await sleep(latencyMs);
    if (!restaurant) {
      return { result: { error: "Unknown restaurant" }, latencyMs };
    }
    return {
      result: {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        date: asString(args.date, saturdayDateIso()),
        party_size: asNumber(args.party_size, 4),
        slots: restaurant.slots,
      },
      latencyMs,
    };
  }

  if (name === "get_menu_highlights") {
    const restaurant = findRestaurant(asString(args.restaurant_id));
    const latencyMs = restaurant?.menuLatencyMs ?? 320;
    await sleep(latencyMs);
    if (!restaurant) {
      return { result: { error: "Unknown restaurant" }, latencyMs };
    }
    return {
      result: {
        restaurant_id: restaurant.id,
        name: restaurant.name,
        vibe: restaurant.vibe,
        highlights: restaurant.highlights,
        price: restaurant.price,
        rating: restaurant.rating,
      },
      latencyMs,
    };
  }

  if (name === "book_table") {
    await sleep(BOOK_LATENCY_MS);
    const restaurant = findRestaurant(asString(args.restaurant_id));
    if (!restaurant) {
      return { result: { error: "Unknown restaurant" }, latencyMs: BOOK_LATENCY_MS };
    }
    const booked: BookingResult = {
      confirmationId: `CBR-${restaurant.id.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase()}-4821`,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      neighborhood: restaurant.neighborhood,
      cuisine: restaurant.cuisine,
      price: restaurant.price,
      rating: restaurant.rating,
      dateLabel: SATURDAY_LABEL,
      time: asString(args.time, restaurant.slots[0] ?? "7:45 PM"),
      partySize: asNumber(args.party_size, 4),
    };
    return { result: booked, booked, latencyMs: BOOK_LATENCY_MS };
  }

  throw new Error(`Unknown tool: ${name}`);
}

export function toolLabel(name: string, args: Record<string, unknown>): string {
  const restaurant = findRestaurant(asString(args.restaurant_id));
  if (name === "search_restaurants") {
    return `search ${asString(args.cuisine, "Italian")} · ${asString(args.neighborhood, "SoMa")}`;
  }
  if (name === "check_availability") {
    return `avail ${restaurant?.name ?? asString(args.restaurant_id)}`;
  }
  if (name === "get_menu_highlights") {
    return `menu ${restaurant?.name ?? asString(args.restaurant_id)}`;
  }
  if (name === "book_table") {
    return `book ${restaurant?.name ?? asString(args.restaurant_id)}`;
  }
  return name;
}

export function summarizeToolResult(name: string, result: unknown): string {
  if (name === "search_restaurants" && result && typeof result === "object" && "matches" in result) {
    const matches = (result as { matches: { name: string }[] }).matches;
    return matches.map((match) => match.name).join(", ");
  }
  if (name === "check_availability" && result && typeof result === "object" && "slots" in result) {
    const slots = (result as { slots: string[]; name?: string }).slots;
    return slots.join(" · ");
  }
  if (name === "get_menu_highlights" && result && typeof result === "object" && "highlights" in result) {
    const highlights = (result as { highlights: string[] }).highlights;
    return highlights.slice(0, 2).join(" · ");
  }
  if (name === "book_table" && result && typeof result === "object" && "confirmationId" in result) {
    return (result as BookingResult).confirmationId;
  }
  return "ok";
}
