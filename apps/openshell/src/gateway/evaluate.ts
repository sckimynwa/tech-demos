import { ATTACHED_PROVIDERS, normalizeCredentialKey } from "./attachedProviders.ts";
import {
  binaryPath,
  globMatch,
  hostMatches,
  methodAllowedByAccess,
  normalizePath,
  pathCovered,
  toolMatches,
} from "./match.ts";
import { parsePolicy } from "./parsePolicy.ts";
import {
  DEFAULT_MCP_BINARY,
  DEFAULT_NETWORK_BINARY,
  WORKDIR,
  type AgentAction,
  type CredentialAction,
  type Endpoint,
  type FileAction,
  type GatewayDecision,
  type McpAction,
  type NetworkAction,
  type NetworkPolicyEntry,
  type Policy,
} from "./types.ts";

type EndpointHit = {
  key: string;
  entry: NetworkPolicyEntry;
  endpoint: Endpoint;
};

function allow(
  layer: GatewayDecision["layer"],
  reason: string,
  extra: Partial<GatewayDecision> = {},
): GatewayDecision {
  return { verdict: "allow", layer, reason, ...extra };
}

function deny(
  layer: GatewayDecision["layer"],
  reason: string,
  extra: Partial<GatewayDecision> = {},
): GatewayDecision {
  return { verdict: "deny", layer, reason, ...extra };
}

function withAudit(decision: GatewayDecision, enforcement?: "enforce" | "audit") {
  if (enforcement !== "audit" || decision.verdict !== "deny") {
    return { ...decision, enforcement: enforcement ?? "enforce" };
  }
  return {
    ...decision,
    verdict: "allow" as const,
    enforcement: "audit" as const,
    auditViolation: true,
    reason: `audit pass-through: ${decision.reason}`,
  };
}

function endpointAddressMatches(
  endpoint: Endpoint,
  host: string,
  port: number,
  requestPath: string,
  protocol?: string,
): boolean {
  if (endpoint.port !== port) return false;
  if (!hostMatches(endpoint.host, host)) return false;
  if (endpoint.path && !globMatch(endpoint.path, requestPath)) return false;
  if (
    protocol &&
    endpoint.protocol &&
    protocol !== "tcp" &&
    endpoint.protocol !== protocol
  ) {
    return false;
  }
  return true;
}

function findEndpointHits(
  policy: Policy,
  host: string,
  port: number,
  requestPath: string,
  binary: string,
  protocol?: string,
): EndpointHit[] {
  const hits: EndpointHit[] = [];
  for (const [key, entry] of Object.entries(policy.network_policies ?? {})) {
    const binaries = (entry.binaries ?? []).map(binaryPath);
    const binaryOk =
      binaries.length === 0 || binaries.some((path) => globMatch(path, binary));
    if (!binaryOk) continue;

    for (const endpoint of entry.endpoints ?? []) {
      if (!endpointAddressMatches(endpoint, host, port, requestPath, protocol)) {
        continue;
      }
      hits.push({ key, entry, endpoint });
    }
  }
  return hits;
}

function hostPortListed(
  policy: Policy,
  host: string,
  port: number,
  requestPath: string,
  protocol?: string,
): boolean {
  return Object.values(policy.network_policies ?? {}).some((entry) =>
    (entry.endpoints ?? []).some((endpoint) =>
      endpointAddressMatches(endpoint, host, port, requestPath, protocol),
    ),
  );
}

function evaluateFile(policy: Policy, action: FileAction): GatewayDecision {
  const path = normalizePath(action.path);
  if (!path) {
    return deny("filesystem", `invalid path '${action.path}'`);
  }

  const filesystem = policy.filesystem_policy ?? {};
  const readWrite = [...(filesystem.read_write ?? [])];
  if (filesystem.include_workdir) readWrite.push(WORKDIR);
  const readOnly = filesystem.read_only ?? [];

  const writeHit = readWrite.find((prefix) => pathCovered(path, prefix));
  if (writeHit) {
    return allow(
      "filesystem",
      `${action.op} ${path} covered by read_write ${writeHit}`,
      { matchedRule: `filesystem_policy.read_write:${writeHit}` },
    );
  }

  const readHit = readOnly.find((prefix) => pathCovered(path, prefix));
  if (readHit) {
    if (action.op === "read") {
      return allow(
        "filesystem",
        `read ${path} covered by read_only ${readHit}`,
        { matchedRule: `filesystem_policy.read_only:${readHit}` },
      );
    }
    return deny(
      "filesystem",
      `write ${path} blocked — ${readHit} is read_only`,
      { matchedRule: `filesystem_policy.read_only:${readHit}` },
    );
  }

  return deny(
    "filesystem",
    `${path} is not listed in filesystem_policy (inaccessible)`,
  );
}

function restDecision(
  action: NetworkAction,
  hit: EndpointHit,
): GatewayDecision {
  const method = action.method.toUpperCase();
  const requestPath = action.path.startsWith("/") ? action.path : `/${action.path}`;
  const ruleName = hit.entry.name ?? hit.key;
  const matched = `${hit.key}:${hit.endpoint.host}:${hit.endpoint.port}`;

  for (const rule of hit.endpoint.deny_rules ?? []) {
    const methodOk = !rule.method || rule.method === "*" || rule.method.toUpperCase() === method;
    const pathOk = !rule.path || globMatch(rule.path, requestPath);
    if (methodOk && pathOk) {
      return deny(
        "network",
        `${method} ${hit.endpoint.host}${requestPath} matched deny_rules`,
        { matchedRule: `${matched} deny ${rule.method ?? "*"} ${rule.path ?? "**"}` },
      );
    }
  }

  if (hit.endpoint.access) {
    if (methodAllowedByAccess(hit.endpoint.access, method)) {
      return allow(
        "network",
        `${method} ${hit.endpoint.host}${requestPath} allowed by ${ruleName} access=${hit.endpoint.access}`,
        { matchedRule: `${matched} access:${hit.endpoint.access}` },
      );
    }
    return deny(
      "network",
      `${method} ${hit.endpoint.host}${requestPath} blocked by access=${hit.endpoint.access}`,
      { matchedRule: `${matched} access:${hit.endpoint.access}` },
    );
  }

  const rules = hit.endpoint.rules ?? [];
  for (const rule of rules) {
    const allowRule = rule.allow;
    const methodOk =
      !allowRule.method ||
      allowRule.method === "*" ||
      allowRule.method.toUpperCase() === method;
    const pathOk = !allowRule.path || globMatch(allowRule.path, requestPath);
    if (methodOk && pathOk) {
      return allow(
        "network",
        `${method} ${hit.endpoint.host}${requestPath} matched ${ruleName} allow rule`,
        { matchedRule: `${matched} allow ${allowRule.method ?? "*"} ${allowRule.path ?? "**"}` },
      );
    }
  }

  if (rules.length === 0 && !hit.endpoint.access) {
    return deny(
      "network",
      `${hit.endpoint.host} matched ${ruleName} but has no access/rules`,
      { matchedRule: matched },
    );
  }

  return deny(
    "network",
    `${method} ${hit.endpoint.host}${requestPath} did not match allow rules on ${ruleName}`,
    { matchedRule: matched },
  );
}

function evaluateNetwork(policy: Policy, action: NetworkAction): GatewayDecision {
  const binary = action.binary ?? DEFAULT_NETWORK_BINARY;
  const requestPath = action.path.startsWith("/") ? action.path : `/${action.path}`;
  const protocol = action.protocol ?? "rest";
  const hits = findEndpointHits(
    policy,
    action.host,
    action.port,
    requestPath,
    binary,
    protocol,
  );

  if (hits.length === 0) {
    if (hostPortListed(policy, action.host, action.port, requestPath)) {
      if (!hostPortListed(policy, action.host, action.port, requestPath, protocol)) {
        return deny(
          "network",
          `no ${protocol} endpoint matched ${action.host}${requestPath}`,
        );
      }
      return deny(
        "network",
        `binary ${binary} is not listed for ${action.host}:${action.port}`,
      );
    }
    return deny(
      "network",
      `default deny: no network_policies entry for ${action.host}:${action.port}`,
    );
  }

  const hit = hits[0];
  if (!hit) {
    return deny("network", "no matching endpoint");
  }
  return withAudit(restDecision(action, hit), hit.endpoint.enforcement);
}

function evaluateMcp(policy: Policy, action: McpAction): GatewayDecision {
  const binary = action.binary ?? DEFAULT_MCP_BINARY;
  const requestPath = action.path.startsWith("/") ? action.path : `/${action.path}`;
  const hits = findEndpointHits(
    policy,
    action.host,
    action.port,
    requestPath,
    binary,
    "mcp",
  );

  if (hits.length === 0) {
    const anyHost = Object.values(policy.network_policies ?? {}).some((entry) =>
      (entry.endpoints ?? []).some(
        (endpoint) =>
          endpoint.protocol === "mcp" &&
          hostMatches(endpoint.host, action.host) &&
          endpoint.port === action.port,
      ),
    );
    if (anyHost) {
      return deny(
        "mcp",
        `binary ${binary} is not listed for MCP ${action.host}:${action.port}`,
      );
    }
    return deny(
      "mcp",
      `default deny: no MCP endpoint for ${action.host}:${action.port}${requestPath}`,
    );
  }

  const hit = hits[0];
  if (!hit) {
    return deny("mcp", "no matching MCP endpoint");
  }
  const ruleName = hit.entry.name ?? hit.key;
  const matched = `${hit.key}:${hit.endpoint.host}`;
  const tool = action.tool;

  for (const rule of hit.endpoint.deny_rules ?? []) {
    const methodOk =
      !rule.method ||
      globMatch(rule.method, action.method);
    const toolOk = toolMatches(rule.tool, tool);
    if (methodOk && toolOk) {
      return withAudit(
        deny(
          "mcp",
          `${action.method}${tool ? ` ${tool}` : ""} denied by ${ruleName} deny_rules`,
          { matchedRule: `${matched} deny ${rule.method ?? "*"} ${formatTool(rule.tool)}` },
        ),
        hit.endpoint.enforcement,
      );
    }
  }

  if (hit.endpoint.mcp?.allow_all_known_mcp_methods && !hit.endpoint.rules?.length) {
    return allow(
      "mcp",
      `${action.method}${tool ? ` ${tool}` : ""} allowed by allow_all_known_mcp_methods`,
      { matchedRule: `${matched} mcp.allow_all_known_mcp_methods`, enforcement: hit.endpoint.enforcement ?? "enforce" },
    );
  }

  for (const rule of hit.endpoint.rules ?? []) {
    const allowRule = rule.allow;
    const methodOk =
      !allowRule.method || globMatch(allowRule.method, action.method);
    const toolOk = toolMatches(allowRule.tool, tool);
    if (methodOk && toolOk) {
      return allow(
        "mcp",
        `${action.method}${tool ? ` ${tool}` : ""} allowed by ${ruleName}`,
        {
          matchedRule: `${matched} allow ${allowRule.method ?? "*"} ${formatTool(allowRule.tool)}`,
          enforcement: hit.endpoint.enforcement ?? "enforce",
        },
      );
    }
  }

  return withAudit(
    deny(
      "mcp",
      `${action.method}${tool ? ` ${tool}` : ""} not listed in ${ruleName} MCP rules`,
      { matchedRule: matched },
    ),
    hit.endpoint.enforcement,
  );
}

function formatTool(tool: string | { any: string[] } | undefined): string {
  if (!tool) return "*";
  if (typeof tool === "string") return tool;
  return tool.any.join("|");
}

function evaluateCredentials(
  policy: Policy,
  action: CredentialAction,
): GatewayDecision {
  const key = normalizeCredentialKey(action.key);
  if (!key) {
    return deny("credentials", "missing credential key");
  }

  const binary = action.binary ?? DEFAULT_NETWORK_BINARY;
  const requestPath = action.path?.startsWith("/")
    ? action.path
    : `/${action.path ?? ""}`;
  const hits = findEndpointHits(
    policy,
    action.host,
    action.port,
    requestPath === "/" ? "/" : requestPath,
    binary,
  );

  const bound = hits.find((hit) => hit.endpoint.credential_binding?.provider);
  if (!bound) {
    return deny(
      "credentials",
      `credential_endpoint_mismatch: ${key} is not bound to ${action.host}:${action.port}`,
    );
  }

  const providerName = bound.endpoint.credential_binding?.provider;
  if (!providerName) {
    return deny("credentials", "credential_binding.provider missing");
  }
  const provider = ATTACHED_PROVIDERS[providerName];
  if (!provider) {
    return deny(
      "credentials",
      `provider '${providerName}' is not attached to this sandbox`,
      { matchedRule: `${bound.key} credential_binding:${providerName}` },
    );
  }
  if (!provider.keys.includes(key)) {
    return deny(
      "credentials",
      `unknown_credential: ${key} is not in attached provider '${providerName}'`,
      { matchedRule: `${bound.key} credential_binding:${providerName}` },
    );
  }

  return allow(
    "credentials",
    `inject ${key} via credential_binding.provider=${providerName} on ${action.host}`,
    { matchedRule: `${bound.key} credential_binding:${providerName}` },
  );
}

export function evaluateAction(
  policy: Policy,
  action: AgentAction,
): GatewayDecision {
  switch (action.kind) {
    case "file":
      return evaluateFile(policy, action);
    case "network":
      return evaluateNetwork(policy, action);
    case "mcp":
      return evaluateMcp(policy, action);
    case "credentials":
      return evaluateCredentials(policy, action);
  }
}

export function evaluateGateway(
  policyYaml: string,
  action: AgentAction,
): GatewayDecision {
  const parsed = parsePolicy(policyYaml);
  if (parsed.ok === false) {
    return deny("policy", parsed.error);
  }
  return evaluateAction(parsed.policy, action);
}
