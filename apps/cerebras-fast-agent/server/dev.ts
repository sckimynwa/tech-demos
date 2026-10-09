const env = { ...process.env };

const server = Bun.spawn({
  cmd: ["bun", "--watch", "server/index.ts"],
  stdout: "inherit",
  stderr: "inherit",
  env,
});

const vite = Bun.spawn({
  cmd: ["bun", "x", "vite", "--host", "0.0.0.0", "--port", "5173"],
  stdout: "inherit",
  stderr: "inherit",
  env,
});

const shutdown = () => {
  server.kill();
  vite.kill();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const [serverCode, viteCode] = await Promise.all([server.exited, vite.exited]);
process.exit(serverCode || viteCode);
