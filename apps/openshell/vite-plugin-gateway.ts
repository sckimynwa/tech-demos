import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { evaluateGateway } from "./src/gateway/evaluate.ts";
import { parsePolicy } from "./src/gateway/parsePolicy.ts";
import type { AgentAction } from "./src/gateway/types.ts";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function newId(): string {
  return `gw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function handleGateway(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET" && req.url === "/api/health") {
    sendJson(res, 200, { ok: true, service: "openshell-gateway" });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/policy/validate") {
    const raw = await readBody(req);
    const payload = JSON.parse(raw) as { policyYaml?: string };
    const parsed = parsePolicy(payload.policyYaml ?? "");
    if (parsed.ok === false) {
      sendJson(res, 200, { ok: false, error: parsed.error });
      return true;
    }
    sendJson(res, 200, { ok: true, summary: parsed.summary });
    return true;
  }

  if (req.method === "POST" && req.url === "/api/gateway") {
    const raw = await readBody(req);
    const payload = JSON.parse(raw) as {
      policyYaml?: string;
      action?: AgentAction;
    };
    if (!payload.action) {
      sendJson(res, 400, { ok: false, error: "action is required" });
      return true;
    }
    const decision = evaluateGateway(payload.policyYaml ?? "", payload.action);
    sendJson(res, 200, {
      ...decision,
      id: newId(),
      ts: new Date().toISOString(),
      action: payload.action,
    });
    return true;
  }

  return false;
}

export function openshellGateway(): Plugin {
  return {
    name: "openshell-gateway",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleGateway(req, res);
          if (!handled) next();
        } catch (error) {
          const message = error instanceof Error ? error.message : "gateway error";
          sendJson(res, 400, { ok: false, error: message });
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleGateway(req, res);
          if (!handled) next();
        } catch (error) {
          const message = error instanceof Error ? error.message : "gateway error";
          sendJson(res, 400, { ok: false, error: message });
        }
      });
    },
  };
}
