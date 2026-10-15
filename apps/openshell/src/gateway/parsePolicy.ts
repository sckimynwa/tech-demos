import { parse } from "yaml";
import type { Policy, PolicySummary } from "./types.ts";

export type ParseOk = { ok: true; policy: Policy; summary: PolicySummary };
export type ParseErr = { ok: false; error: string };
export type ParseResult = ParseOk | ParseErr;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringList(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be a list of strings`);
  }
  return value;
}

export function summarizePolicy(policy: Policy): PolicySummary {
  const entries = Object.values(policy.network_policies ?? {});
  const endpoints = entries.flatMap((entry) => entry.endpoints ?? []);
  return {
    readOnly: policy.filesystem_policy?.read_only?.length ?? 0,
    readWrite: policy.filesystem_policy?.read_write?.length ?? 0,
    includeWorkdir: Boolean(policy.filesystem_policy?.include_workdir),
    networkRules: entries.length,
    mcpEndpoints: endpoints.filter((endpoint) => endpoint.protocol === "mcp")
      .length,
    credentialBindings: endpoints.filter(
      (endpoint) => Boolean(endpoint.credential_binding?.provider),
    ).length,
  };
}

export function parsePolicy(yamlText: string): ParseResult {
  try {
    const doc = parse(yamlText);
    if (!isRecord(doc)) {
      return { ok: false, error: "Policy YAML must be a mapping" };
    }
    if (doc.version !== 1) {
      return { ok: false, error: "version must be 1" };
    }

    const filesystem = doc.filesystem_policy;
    let readOnly: string[] = [];
    let readWrite: string[] = [];
    if (filesystem !== undefined) {
      if (!isRecord(filesystem)) {
        return { ok: false, error: "filesystem_policy must be a mapping" };
      }
      readOnly = asStringList(filesystem.read_only, "filesystem_policy.read_only");
      readWrite = asStringList(filesystem.read_write, "filesystem_policy.read_write");
    }

    for (const path of [...readOnly, ...readWrite]) {
      if (!path.startsWith("/")) {
        return { ok: false, error: `filesystem path must be absolute: ${path}` };
      }
      if (path.split("/").includes("..")) {
        return { ok: false, error: `filesystem path rejects '..': ${path}` };
      }
    }
    if (readWrite.includes("/")) {
      return { ok: false, error: "read_write must not be '/' alone" };
    }

    const network = doc.network_policies;
    if (network !== undefined && !isRecord(network)) {
      return { ok: false, error: "network_policies must be a mapping" };
    }

    const policy = doc as unknown as Policy;
    return { ok: true, policy, summary: summarizePolicy(policy) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid YAML";
    return { ok: false, error: message };
  }
}
