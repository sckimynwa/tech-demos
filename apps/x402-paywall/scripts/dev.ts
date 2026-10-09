const apiPort = process.env.PORT ?? "8787";
const uiPort = process.env.X402_UI_PORT ?? "5173";

const api = Bun.spawn(["bun", "--hot", "server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env: { ...process.env, PORT: apiPort },
});

const ui = Bun.spawn(
  ["bun", "x", "vite", "--host", "0.0.0.0", "--port", uiPort],
  {
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env, PORT: apiPort, X402_UI_PORT: uiPort },
  },
);

const shutdown = () => {
  api.kill();
  ui.kill();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const [apiCode, uiCode] = await Promise.all([api.exited, ui.exited]);
process.exit(apiCode || uiCode);
