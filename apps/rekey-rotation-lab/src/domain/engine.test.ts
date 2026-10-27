import { describe, expect, test } from "bun:test";
import { targetsInPropagationOrder } from "./fixture.ts";
import { planRotation, planUndo, initialWorld } from "./engine.ts";
import { maskSecret, NEW_CREDENTIAL, OLD_CREDENTIAL, SECRET_BODY } from "./secrets.ts";

function writeOrder(options: { vercelRedeployFails: boolean; failWriteRel?: string }) {
  return planRotation(options)
    .steps.filter((step) => step.id.startsWith("write-"))
    .map((step) => step.id.replace("write-", ""));
}

describe("maskSecret", () => {
  test("keeps a fake prefix and the tail, hides the body", () => {
    const masked = maskSecret(OLD_CREDENTIAL);
    expect(masked.startsWith("sk-proj-FAKE")).toBe(true);
    expect(masked.endsWith("wxyz")).toBe(true);
    expect(masked).not.toContain(SECRET_BODY);
    expect(maskSecret(NEW_CREDENTIAL)).not.toContain(SECRET_BODY);
  });
});

describe("planRotation", () => {
  test("writes targets in template path order", () => {
    const rels = targetsInPropagationOrder().map((target) => target.rel);
    expect(rels).toEqual([
      "shop/file/shop/web/.env.local",
      "shop/github/acme/shop",
      "shop/supabase/shopproj",
      "shop/vercel/shop/production",
    ]);
    expect(writeOrder({ vercelRedeployFails: false })).toEqual([
      "file",
      "github",
      "supabase",
      "vercel",
    ]);
  });

  test("keeps going after one write fails", () => {
    const plan = planRotation({
      vercelRedeployFails: false,
      failWriteRel: "shop/github/acme/shop",
    });
    const last = plan.frames[plan.frames.length - 1];
    expect(last?.targets.github.stored).toBe(OLD_CREDENTIAL);
    expect(last?.targets.github.writeError).toBe("mock write refused");
    expect(last?.targets.supabase.stored).toBe(NEW_CREDENTIAL);
    expect(last?.targets.vercel.stored).toBe(NEW_CREDENTIAL);
    expect(last?.targets.file.stored).toBe(NEW_CREDENTIAL);
    const result = plan.steps.find((step) => step.id === "result");
    expect(result?.log.join("\n")).toContain("rekey sync targets/shop/github/acme/shop.tpl");
    expect(plan.steps.flatMap((step) => step.log).join("\n")).not.toContain(SECRET_BODY);
  });

  test("failed vercel redeploy leaves the new env var and the old runtime", () => {
    const plan = planRotation({ vercelRedeployFails: true });
    const last = plan.frames[plan.frames.length - 1];
    expect(last?.targets.vercel.phase).toBe("deploy-failed");
    expect(last?.targets.vercel.stored).toBe(NEW_CREDENTIAL);
    expect(last?.targets.vercel.loaded).toBe(OLD_CREDENTIAL);
    expect(last?.targets.github.loaded).toBe(OLD_CREDENTIAL);
    expect(last?.targets.github.stored).toBe(NEW_CREDENTIAL);
    expect(last?.targets.supabase.loaded).toBe(NEW_CREDENTIAL);
    expect(last?.targets.file.loaded).toBe(NEW_CREDENTIAL);
    expect(last?.vault.previous).toBe(OLD_CREDENTIAL);
    expect(last?.vault.current).toBe(NEW_CREDENTIAL);
    expect(last?.vault.revoke).toEqual({ credential: OLD_CREDENTIAL });
    expect(plan.steps.some((step) => step.id === "undo-delete")).toBe(false);
    expect(plan.steps.find((step) => step.id === "result")?.tone).toBe("error");
    expect(plan.steps.flatMap((step) => step.log).join("\n")).not.toContain(SECRET_BODY);
  });

  test("healthy redeploy loads the new key and still withholds revoke", () => {
    const plan = planRotation({ vercelRedeployFails: false });
    const last = plan.frames[plan.frames.length - 1];
    expect(last?.targets.vercel.phase).toBe("live");
    expect(last?.targets.vercel.loaded).toBe(NEW_CREDENTIAL);
    expect(last?.vault.revoke).toEqual({ credential: OLD_CREDENTIAL });
    expect(last?.issuer.keys.map((key) => key.status)).toEqual(["pending-revoke", "active"]);
    const result = plan.steps.find((step) => step.id === "result");
    expect(result?.log.join("\n")).toContain("rekey revoke shop.openai");
    expect(result?.log.join("\n")).toContain("default answer is no");
  });
});

describe("planUndo", () => {
  test("restores every target and deletes the issued key", () => {
    const rotated = planRotation({ vercelRedeployFails: true });
    const failed = rotated.frames[rotated.frames.length - 1];
    if (!failed) {
      throw new Error("missing frame");
    }
    const undone = planUndo(failed);
    const last = undone.frames[undone.frames.length - 1];
    expect(last?.targets.file.stored).toBe(OLD_CREDENTIAL);
    expect(last?.targets.github.stored).toBe(OLD_CREDENTIAL);
    expect(last?.targets.supabase.stored).toBe(OLD_CREDENTIAL);
    expect(last?.targets.vercel.stored).toBe(OLD_CREDENTIAL);
    expect(last?.targets.vercel.loaded).toBe(OLD_CREDENTIAL);
    expect(last?.targets.vercel.phase).toBe("live");
    expect(last?.vault.current).toBe(OLD_CREDENTIAL);
    expect(last?.vault.previous).toBeNull();
    expect(last?.vault.revoke).toBeNull();
    expect(last?.issuer.keys.find((key) => key.id === "key_fake_new")?.status).toBe("deleted");
    expect(undone.steps.flatMap((step) => step.log).join("\n")).not.toContain(SECRET_BODY);
  });

  test("refuses when nothing is waiting to be revoked", () => {
    const plan = planUndo(initialWorld());
    expect(plan.steps[0]?.id).toBe("undo-empty");
    expect(plan.frames[0]?.vault.current).toBe(OLD_CREDENTIAL);
  });
});
