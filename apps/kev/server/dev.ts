const env = { ...process.env };

const server = Bun.spawn(["bun", "--watch", "server/index.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  env,
});

const vite = Bun.spawn(["bunx", "vite", "--host", "127.0.0.1"], {
  stdout: "inherit",
  stderr: "inherit",
  env,
});

function shutdown() {
  server.kill();
  vite.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const codes = await Promise.all([server.exited, vite.exited]);
process.exit(codes.find((code) => code !== 0) ?? 0);
