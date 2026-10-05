import { DEFAULT_MODEL, type ApiConfig } from "../src/shared/systemone.ts";
import { baseUrlHost, defaultModel, forwardSystemOne, liveBaseUrl } from "./kev-client.ts";
import { mockLatencyMs, mockRequestId, mockSystemOne, validateRequest } from "./mock.ts";

const PORT = Number(process.env.PORT ?? 8787);

function wantsMock(url: URL): boolean {
  return url.searchParams.get("mock") === "1" || liveBaseUrl() == null;
}

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

function corsHeaders(): HeadersInit {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  };
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (req.method === "GET" && url.pathname === "/api/config") {
      const mock = wantsMock(url);
      const payload: ApiConfig = {
        mode: mock ? "mock" : "live",
        model: defaultModel(),
        baseUrlHost: mock ? null : baseUrlHost(liveBaseUrl()),
      };
      return json(payload, { headers: corsHeaders() });
    }

    if (req.method === "POST" && url.pathname === "/api/systemone") {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return json({ detail: "Invalid JSON body" }, { status: 400, headers: corsHeaders() });
      }
      const checked = validateRequest(body);
      if (!checked.ok) {
        return json({ detail: checked.message }, { status: checked.status, headers: corsHeaders() });
      }

      const mock = wantsMock(url);
      if (mock) {
        const latencyMs = mockLatencyMs(checked.request);
        await Bun.sleep(latencyMs);
        const response = mockSystemOne(checked.request, latencyMs);
        return json(response, {
          headers: {
            ...corsHeaders(),
            "x-typesafe-request-id": mockRequestId(checked.request),
            "x-kev-mode": "mock",
          },
        });
      }

      try {
        const forwarded = await forwardSystemOne({
          ...checked.request,
          model: checked.request.model || defaultModel() || DEFAULT_MODEL,
        });
        const headers = new Headers(corsHeaders());
        headers.set("content-type", "application/json");
        headers.set("x-kev-mode", "live");
        if (forwarded.requestId) {
          headers.set("x-typesafe-request-id", forwarded.requestId);
        }
        return new Response(forwarded.body, { status: forwarded.status, headers });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to reach Kev";
        return json(
          { detail: `Unreachable Kev server: ${message}` },
          { status: 502, headers: { ...corsHeaders(), "x-kev-mode": "live" } },
        );
      }
    }

    return json({ detail: "Not found" }, { status: 404, headers: corsHeaders() });
  },
});

const mode = liveBaseUrl() ? `live → ${baseUrlHost(liveBaseUrl())}` : "mock";
console.log(`Kev API http://127.0.0.1:${PORT} (${mode})`);
