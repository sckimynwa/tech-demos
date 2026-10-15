import { createFetch } from "./app";
import { loadConfig } from "./config";

const config = loadConfig();
const fetchHandler = createFetch(config);

const server = Bun.serve({
  port: config.port,
  fetch: fetchHandler,
});

console.log(
  `[x402] simulated resource server on http://127.0.0.1:${server.port}`,
);
console.log(`[x402] paywalled GET ${config.resource.url}`);
console.log(`[x402] quote ${config.amount} atomic USDC on ${config.network}`);
