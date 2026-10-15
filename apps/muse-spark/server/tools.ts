export const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_current_time",
      description:
        "Return the current date and time. Pass an IANA timezone when the user names a city or region.",
      parameters: {
        type: "object",
        properties: {
          timezone: {
            type: "string",
            description:
              "IANA timezone such as Asia/Seoul or America/New_York. Omit for the server local zone.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_weather",
      description:
        "Return current weather for a city. Use this before advising on jackets, umbrellas, or outdoor plans.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "City name, e.g. Seoul or Tokyo",
          },
        },
        required: ["location"],
        additionalProperties: false,
      },
    },
  },
] as const;

export const TOOL_NAMES = TOOL_DEFINITIONS.map((tool) => tool.function.name);

const CITY_TIMEZONES: Record<string, string> = {
  seoul: "Asia/Seoul",
  tokyo: "Asia/Tokyo",
  osaka: "Asia/Tokyo",
  london: "Europe/London",
  paris: "Europe/Paris",
  "new york": "America/New_York",
  nyc: "America/New_York",
  "san francisco": "America/Los_Angeles",
  sf: "America/Los_Angeles",
};

const WEATHER_TABLE: Record<
  string,
  { tempC: number; condition: string; windKph: number; humidity: number }
> = {
  seoul: { tempC: 12, condition: "Overcast", windKph: 18, humidity: 64 },
  tokyo: { tempC: 18, condition: "Light rain", windKph: 14, humidity: 81 },
  osaka: { tempC: 19, condition: "Humid", windKph: 10, humidity: 74 },
  london: { tempC: 9, condition: "Drizzle", windKph: 22, humidity: 88 },
  paris: { tempC: 14, condition: "Broken clouds", windKph: 12, humidity: 70 },
  "new york": { tempC: 21, condition: "Clear", windKph: 9, humidity: 48 },
  nyc: { tempC: 21, condition: "Clear", windKph: 9, humidity: 48 },
  "san francisco": { tempC: 15, condition: "Fog", windKph: 20, humidity: 86 },
  sf: { tempC: 15, condition: "Fog", windKph: 20, humidity: 86 },
};

function normalizeCity(value: string) {
  return value.trim().toLowerCase();
}

export function resolveTimezone(timezone?: string) {
  if (!timezone) return Intl.DateTimeFormat().resolvedOptions().timeZone;
  const mapped = CITY_TIMEZONES[normalizeCity(timezone)];
  return mapped ?? timezone;
}

export function getCurrentTime(timezone?: string) {
  const zone = resolveTimezone(timezone);
  const now = new Date();
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(now);

  return {
    timezone: zone,
    iso: now.toISOString(),
    formatted,
  };
}

export function getWeather(location: string) {
  const key = normalizeCity(location);
  const row = WEATHER_TABLE[key] ?? {
    tempC: 16,
    condition: "Partly cloudy",
    windKph: 11,
    humidity: 58,
  };

  return {
    location,
    ...row,
    source: "playground-station",
    note:
      WEATHER_TABLE[key] === undefined
        ? "No station match — returning a generic reading."
        : "Deterministic playground reading (not a live weather API).",
  };
}

export function executeTool(name: string, args: Record<string, unknown>) {
  if (name === "get_current_time") {
    const timezone =
      typeof args.timezone === "string" ? args.timezone : undefined;
    return getCurrentTime(timezone);
  }

  if (name === "get_weather") {
    const location = typeof args.location === "string" ? args.location : "";
    if (!location) {
      return { error: "location is required" };
    }
    return getWeather(location);
  }

  return { error: `Unknown tool: ${name}` };
}
