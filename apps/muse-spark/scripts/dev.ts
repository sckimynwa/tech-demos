const API_PORT = process.env.API_PORT ?? "3001";
const PORT = process.env.PORT ?? "5173";
const root = new URL("..", import.meta.url).pathname;

const env = {
  ...process.env,
  API_PORT,
  PORT,
};

const api = Bun.spawn({
  cmd: ["bun", "--watch", "server/index.ts"],
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
  env,
});

async function waitForHealth() {
  const deadline = Date.now() + 12_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${API_PORT}/api/health`);
      if (response.ok) return;
    } catch {
      // still booting
    }
    await Bun.sleep(80);
  }
  throw new Error(`API did not become ready on port ${API_PORT}`);
}

await waitForHealth();

const vite = Bun.spawn({
  cmd: ["bunx", "vite", "--host", "--port", PORT],
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
  env,
});

const shutdown = () => {
  api.kill();
  vite.kill();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const [apiCode, viteCode] = await Promise.all([api.exited, vite.exited]);
process.exit(apiCode || viteCode);
