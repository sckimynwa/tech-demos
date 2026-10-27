import { spawn } from "node:child_process";
import { access, cp, mkdtemp, rm } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import type { Plugin } from "vite";

const CLONE_TIMEOUT_MS = 60_000;
const DRY_RUN_TIMEOUT_MS = 20_000;
const OUTPUT_LIMIT = 40_000;
const REKEY_REPO_URL = "https://github.com/golbin/rekey.git";

interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function run(command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv; timeout: number }): Promise<CommandResult> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout = (stdout + chunk).slice(-OUTPUT_LIMIT);
    });
    child.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-OUTPUT_LIMIT);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolvePromise({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function ensureCheckout(): Promise<string> {
  const dest = path.join(tmpdir(), "golbin-rekey-readonly");
  const script = path.join(dest, "rekey");
  try {
    await access(script);
    return dest;
  } catch {
    await rm(dest, { recursive: true, force: true });
    const cloned = await run(
      "git",
      ["clone", "--depth", "1", REKEY_REPO_URL, dest],
      { cwd: tmpdir(), env: process.env, timeout: CLONE_TIMEOUT_MS },
    );
    if (cloned.code !== 0) {
      throw new Error(cloned.stderr || cloned.stdout || "git clone failed");
    }
    return dest;
  }
}

async function dryRun(appRoot: string): Promise<CommandResult> {
  const checkout = await ensureCheckout();
  const sandbox = await mkdtemp(path.join(tmpdir(), "rekey-lab-"));
  const home = path.join(sandbox, "team");
  await cp(path.join(appRoot, "fixtures", "rekey-home"), home, { recursive: true });
  const storePath = path.join(sandbox, "store.json");
  await cp(path.join(home, "store.json"), storePath);
  return run("python3", [path.join(checkout, "rekey"), "--no-input", "rotate", "shop.openai", "--dry-run"], {
    cwd: home,
    timeout: DRY_RUN_TIMEOUT_MS,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      LANG: "C.UTF-8",
      REKEY_HOME: home,
      REKEY_ROOT: sandbox,
      REKEY_STORE: `file:${storePath}`,
      REKEY_LANG: "en",
      REKEY_NO_BROWSER: "1",
      PYTHONPATH: checkout,
      PYTHONDONTWRITEBYTECODE: "1",
    },
  });
}

function handle(appRoot: string, req: IncomingMessage, res: ServerResponse): void {
  if (req.method !== "POST") {
    send(res, 405, { ok: false, error: "POST /api/rekey-dry-run" });
    return;
  }
  if (process.env.REKEY_REAL !== "1") {
    send(res, 403, {
      ok: false,
      error:
        "Real rekey CLI is off. Restart with REKEY_REAL=1. The switch in the UI does nothing until then, and the command is always --no-input rotate --dry-run.",
    });
    return;
  }
  dryRun(appRoot)
    .then((result) => {
      send(res, result.code === 0 ? 200 : 500, {
        ok: result.code === 0,
        code: result.code,
        stdout: result.stdout,
        stderr: result.stderr,
      });
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "dry-run failed";
      send(res, 500, { ok: false, error: message });
    });
}

export function rekeyDryRunPlugin(appRoot: string): Plugin {
  const middleware = (req: IncomingMessage, res: ServerResponse) => {
    handle(appRoot, req, res);
  };
  return {
    name: "rekey-dry-run",
    configureServer(server) {
      server.middlewares.use("/api/rekey-dry-run", middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/rekey-dry-run", middleware);
    },
  };
}
