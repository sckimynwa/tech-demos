import { describe, expect, test } from "bun:test";
import { evaluateGateway } from "./evaluate.ts";
import { parsePolicy } from "./parsePolicy.ts";
import { PRESETS } from "./presets.ts";

const defaultPolicyYaml = await Bun.file(
  new URL("./defaultPolicy.yaml", import.meta.url),
).text();

describe("parsePolicy", () => {
  test("parses the default OpenShell-shaped policy", () => {
    const parsed = parsePolicy(defaultPolicyYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.policy.version).toBe(1);
    expect(parsed.summary.networkRules).toBe(4);
    expect(parsed.summary.mcpEndpoints).toBe(1);
    expect(parsed.summary.credentialBindings).toBe(2);
  });

  test("rejects non-v1 and relative filesystem paths", () => {
    expect(parsePolicy("version: 2\n").ok).toBe(false);
    const relative = parsePolicy(
      "version: 1\nfilesystem_policy:\n  read_write: [tmp]\n",
    );
    expect(relative.ok).toBe(false);
    if (relative.ok) return;
    expect(relative.error).toContain("absolute");
  });
});

describe("evaluateGateway presets", () => {
  for (const preset of PRESETS) {
    test(`${preset.id} → ${preset.expect}`, () => {
      const decision = evaluateGateway(defaultPolicyYaml, preset.action);
      if (preset.expect === "audit") {
        expect(decision.verdict).toBe("allow");
        expect(decision.auditViolation).toBe(true);
        expect(decision.enforcement).toBe("audit");
        return;
      }
      expect(decision.verdict).toBe(preset.expect);
    });
  }
});

describe("evaluateGateway edge cases", () => {
  test("invalid YAML is a policy deny", () => {
    const decision = evaluateGateway("version: [", {
      kind: "file",
      op: "read",
      path: "/tmp/x",
    });
    expect(decision.verdict).toBe("deny");
    expect(decision.layer).toBe("policy");
  });

  test("path traversal cannot escape filesystem prefixes", () => {
    const decision = evaluateGateway(defaultPolicyYaml, {
      kind: "file",
      op: "write",
      path: "/tmp/../etc/shadow",
    });
    expect(decision.verdict).toBe("deny");
    expect(decision.reason).toContain("read_only");
  });

  test("GitHub deploy-key path is deny_rules", () => {
    const decision = evaluateGateway(defaultPolicyYaml, {
      kind: "network",
      method: "GET",
      host: "api.github.com",
      port: 443,
      path: "/repos/NVIDIA/OpenShell/keys",
    });
    expect(decision.verdict).toBe("deny");
    expect(decision.reason).toContain("deny_rules");
  });
});
