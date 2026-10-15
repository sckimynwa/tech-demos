import { MOCK_TOKEN_DELAY_MS } from "./constants";
import { executeTool, getCurrentTime, getWeather } from "./tools";
import { streamText } from "./sse";
import type { ChatMessage, SseSender, ToolCall } from "./types";

const TIME_RE =
  /\b(time|clock|timezone|what time|현재 시간|몇 시)\b/i;
const WEATHER_RE =
  /\b(weather|umbrella|jacket|walk|rain|온도|날씨|우산|재킷)\b/i;

function lastUserText(messages: ChatMessage[]) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message?.role === "user" && message.content) {
      return message.content;
    }
  }
  return "";
}

function inferCity(text: string) {
  const cities = [
    "San Francisco",
    "New York",
    "Seoul",
    "Tokyo",
    "Osaka",
    "London",
    "Paris",
  ];
  const lower = text.toLowerCase();
  return cities.find((city) => lower.includes(city.toLowerCase())) ?? "Seoul";
}

function inferTimezone(city: string) {
  const map: Record<string, string> = {
    Seoul: "Asia/Seoul",
    Tokyo: "Asia/Tokyo",
    Osaka: "Asia/Tokyo",
    London: "Europe/London",
    Paris: "Europe/Paris",
    "New York": "America/New_York",
    "San Francisco": "America/Los_Angeles",
  };
  return map[city] ?? "Asia/Seoul";
}

function planToolCalls(text: string): ToolCall[] {
  const wantsTime = TIME_RE.test(text);
  const wantsWeather = WEATHER_RE.test(text);
  const city = inferCity(text);
  const calls: ToolCall[] = [];

  if (wantsWeather) {
    calls.push({
      id: "call_weather",
      name: "get_weather",
      arguments: { location: city },
    });
  }

  if (wantsTime || (!wantsWeather && TIME_RE.test(text))) {
    calls.push({
      id: "call_time",
      name: "get_current_time",
      arguments: { timezone: inferTimezone(city) },
    });
  }

  if (calls.length === 0 && /\b(seoul|tokyo|london|paris|walk)\b/i.test(text)) {
    calls.push({
      id: "call_weather",
      name: "get_weather",
      arguments: { location: city },
    });
  }

  return calls.slice(0, 2);
}

function composeReply(
  userText: string,
  traces: Array<{ call: ToolCall; result: unknown }>,
) {
  if (traces.length === 0) {
    return [
      "Muse Spark is Meta's agentic model on the OpenAI-compatible Model API (`https://api.meta.ai/v1`).",
      "This playground streams Chat Completions and runs a 1–2 step tool loop (`get_weather`, `get_current_time`).",
      "You're in mock mode — set `MODEL_API_KEY` on the server to hit live Muse Spark. Ask for Seoul weather or Tokyo time to see tools fire.",
    ].join(" ");
  }

  const weather = traces.find((trace) => trace.call.name === "get_weather");
  const time = traces.find((trace) => trace.call.name === "get_current_time");
  const parts: string[] = [];

  if (weather && typeof weather.result === "object" && weather.result) {
    const reading = weather.result as ReturnType<typeof getWeather>;
    parts.push(
      `${reading.location} is ${reading.tempC}°C and ${reading.condition.toLowerCase()}, wind ${reading.windKph} km/h, humidity ${reading.humidity}%.`,
    );

    const wantsUmbrella = /umbrella|우산|rain/i.test(userText);
    const wantsWalk = /walk|jacket|재킷/i.test(userText);
    if (wantsUmbrella || /rain|drizzle/i.test(reading.condition)) {
      parts.push(
        /rain|drizzle/i.test(reading.condition)
          ? "Yes — take an umbrella."
          : "No umbrella needed.",
      );
    }
    if (wantsWalk) {
      const isGoodWalk =
        reading.tempC >= 10 &&
        reading.tempC <= 24 &&
        !/rain|drizzle|fog/i.test(reading.condition);
      parts.push(
        isGoodWalk
          ? "A short walk is fine; a light layer is enough."
          : "I would skip a long walk or bring a jacket.",
      );
    }
  }

  if (time && typeof time.result === "object" && time.result) {
    const clock = time.result as ReturnType<typeof getCurrentTime>;
    parts.push(`Local time in ${clock.timezone} is ${clock.formatted}.`);
  }

  parts.push("Mock loop finished — same SSE events as a live Muse Spark run.");
  return parts.join(" ");
}

export async function runMockAgent(
  sender: SseSender,
  messages: ChatMessage[],
) {
  const userText = lastUserText(messages);
  const planned = planToolCalls(userText);
  const traces: Array<{ call: ToolCall; result: unknown }> = [];

  for (const call of planned) {
    await sender.send("tool_call", {
      id: call.id,
      name: call.name,
      arguments: call.arguments,
    });
    await Bun.sleep(90);
    const result = executeTool(call.name, call.arguments);
    traces.push({ call, result });
    await sender.send("tool_result", {
      id: call.id,
      name: call.name,
      result,
    });
    await Bun.sleep(70);
  }

  await streamText(sender, composeReply(userText, traces), MOCK_TOKEN_DELAY_MS);
  await sender.send("done", { finishReason: "stop", rounds: planned.length ? 1 : 0 });
}
