export const WORKDIR = "/workspace";
export const DEFAULT_NETWORK_BINARY = "/usr/bin/curl";
export const DEFAULT_MCP_BINARY = "/usr/bin/python3";

export type ActionKind = "file" | "network" | "mcp" | "credentials";

export type FileAction = {
  kind: "file";
  op: "read" | "write";
  path: string;
};

export type NetworkAction = {
  kind: "network";
  method: string;
  host: string;
  port: number;
  path: string;
  protocol?: "rest" | "websocket" | "graphql" | "tcp";
  binary?: string;
};

export type McpAction = {
  kind: "mcp";
  host: string;
  port: number;
  path: string;
  method: string;
  tool?: string;
  binary?: string;
};

export type CredentialAction = {
  kind: "credentials";
  host: string;
  port: number;
  path?: string;
  key: string;
  binary?: string;
};

export type AgentAction =
  | FileAction
  | NetworkAction
  | McpAction
  | CredentialAction;

export type DecisionLayer =
  | "policy"
  | "filesystem"
  | "network"
  | "mcp"
  | "credentials";

export type Verdict = "allow" | "deny";

export type GatewayDecision = {
  verdict: Verdict;
  reason: string;
  layer: DecisionLayer;
  matchedRule?: string;
  enforcement?: "enforce" | "audit";
  auditViolation?: boolean;
};

export type GatewayResponse = GatewayDecision & {
  id: string;
  ts: string;
  action: AgentAction;
};

export type AccessLevel = "read-only" | "read-write" | "full";
export type Enforcement = "enforce" | "audit";
export type Protocol = "rest" | "websocket" | "graphql" | "mcp" | "json-rpc";

export type BinaryRef = string | { path: string };

export type AllowRule = {
  allow: {
    method?: string;
    path?: string;
    tool?: string | { any: string[] };
    operation_type?: string;
  };
};

export type DenyRule = {
  method?: string;
  path?: string;
  tool?: string | { any: string[] };
};

export type Endpoint = {
  host: string;
  port: number;
  path?: string;
  protocol?: Protocol;
  enforcement?: Enforcement;
  access?: AccessLevel;
  rules?: AllowRule[];
  deny_rules?: DenyRule[];
  credential_binding?: { provider: string };
  request_body_credential_rewrite?: boolean;
  mcp?: {
    strict_tool_names?: boolean;
    allow_all_known_mcp_methods?: boolean;
  };
};

export type NetworkPolicyEntry = {
  name?: string;
  endpoints: Endpoint[];
  binaries: BinaryRef[];
};

export type Policy = {
  version: number;
  filesystem_policy?: {
    include_workdir?: boolean;
    read_only?: string[];
    read_write?: string[];
  };
  landlock?: { compatibility?: string };
  process?: { run_as_user?: string; run_as_group?: string };
  network_policies?: Record<string, NetworkPolicyEntry>;
  network_middlewares?: Record<string, unknown>;
};

export type PolicySummary = {
  readOnly: number;
  readWrite: number;
  includeWorkdir: boolean;
  networkRules: number;
  mcpEndpoints: number;
  credentialBindings: number;
};

export type AttachedProviders = Record<string, { keys: string[] }>;
