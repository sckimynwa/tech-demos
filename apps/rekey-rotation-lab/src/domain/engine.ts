import { targetById, targetsInPropagationOrder, type TargetId } from "./fixture.ts";
import {
  ADMIN_VAULT_NAME,
  ISSUED_KEY_NAME,
  ITEM_NAME,
  maskSecret,
  NEW_CREDENTIAL,
  OLD_CREDENTIAL,
  VAULT_NAME,
} from "./secrets.ts";
import type { LabStep, Patch, Plan, TargetSnapshot, World } from "./types.ts";

export interface RotationOptions {
  /** Lab-only. The real CLI has no failure flag; this forces Vercel readyState ERROR. */
  vercelRedeployFails: boolean;
  /** Test hook: one target write throws. Later targets still run, matching rekey `sync`. */
  failWriteRel?: string;
}

const OLD_KEY_ID = "key_fake_old";
const NEW_KEY_ID = "key_fake_new";

export function initialWorld(): World {
  const targets = {} as World["targets"];
  for (const spec of targetsInPropagationOrder()) {
    targets[spec.id] = {
      stored: OLD_CREDENTIAL,
      loaded: OLD_CREDENTIAL,
      phase: "steady",
      writeError: null,
    };
  }
  return {
    vault: {
      name: VAULT_NAME,
      item: ITEM_NAME,
      current: OLD_CREDENTIAL,
      previous: null,
      revoke: null,
      undo: false,
    },
    issuer: {
      label: "OpenAI",
      keys: [
        {
          id: OLD_KEY_ID,
          secret: OLD_CREDENTIAL,
          name: "shop-checkout",
          status: "active",
        },
      ],
    },
    targets,
  };
}

function cloneWorld(world: World): World {
  return structuredClone(world);
}

function snapshot(world: World): TargetSnapshot[] {
  return targetsInPropagationOrder().map((spec) => {
    const runtime = world.targets[spec.id];
    return {
      id: spec.id,
      stored: runtime.stored,
      loaded: runtime.loaded,
      phase: runtime.phase,
    };
  });
}

export function applyPatch(world: World, patch: Patch): World {
  const next = cloneWorld(world);
  switch (patch.kind) {
    case "none":
      return next;
    case "issue": {
      next.issuer.keys = [
        { id: OLD_KEY_ID, secret: OLD_CREDENTIAL, name: "shop-checkout", status: "pending-revoke" },
        { id: NEW_KEY_ID, secret: NEW_CREDENTIAL, name: ISSUED_KEY_NAME, status: "active" },
      ];
      return next;
    }
    case "vault-save": {
      next.vault.current = NEW_CREDENTIAL;
      next.vault.previous = OLD_CREDENTIAL;
      next.vault.revoke = { credential: OLD_CREDENTIAL };
      next.vault.undo = false;
      return next;
    }
    case "write":
    case "restore": {
      const spec = targetById(patch.targetId);
      const runtime = next.targets[patch.targetId];
      runtime.stored = patch.value;
      runtime.writeError = null;
      const immediate = spec.pickup === "file" || spec.pickup === "edge-immediate";
      if (immediate) {
        runtime.loaded = patch.value;
      }
      runtime.phase = patch.kind === "restore" ? "restored" : immediate ? "live" : "written";
      return next;
    }
    case "write-failed": {
      const runtime = next.targets[patch.targetId];
      runtime.writeError = patch.reason;
      return next;
    }
    case "deploy-start": {
      next.targets[patch.targetId].phase = "deploying";
      return next;
    }
    case "deploy-finish": {
      const runtime = next.targets[patch.targetId];
      if (patch.ok) {
        runtime.loaded = runtime.stored;
        runtime.phase = "live";
        runtime.writeError = null;
      } else {
        runtime.phase = "deploy-failed";
      }
      return next;
    }
    case "vault-undo": {
      const issued = next.vault.current;
      const restored = next.vault.previous ?? next.vault.current;
      next.vault.current = restored;
      next.vault.previous = issued;
      next.vault.revoke = { credential: issued };
      next.vault.undo = true;
      return next;
    }
    case "delete-issued": {
      next.issuer.keys = next.issuer.keys.map((key) => {
        if (key.id === NEW_KEY_ID) {
          return { ...key, status: "deleted" };
        }
        if (key.id === OLD_KEY_ID) {
          return { ...key, status: "active" };
        }
        return key;
      });
      next.vault.previous = null;
      next.vault.revoke = null;
      next.vault.undo = false;
      return next;
    }
    default: {
      const unreachable: never = patch;
      return unreachable;
    }
  }
}

interface Draft {
  world: World;
  steps: LabStep[];
  frames: World[];
}

function push(draft: Draft, step: LabStep, patch: Patch): void {
  draft.world = applyPatch(draft.world, patch);
  draft.steps.push(step);
  draft.frames.push(draft.world);
}

function diffFor(world: World, targetId: TargetId, after: string) {
  const spec = targetById(targetId);
  const runtime = world.targets[targetId];
  return {
    targetId,
    variable: spec.variable,
    before: runtime.stored,
    after,
    loaded: runtime.loaded,
    plainUnchanged: spec.plainLines,
  };
}

export function planRotation(options: RotationOptions): Plan {
  const draft: Draft = { world: initialWorld(), steps: [], frames: [] };
  const order = targetsInPropagationOrder();
  const maskedOld = maskSecret(OLD_CREDENTIAL);
  const maskedNew = maskSecret(NEW_CREDENTIAL);

  push(
    draft,
    {
      id: "preflight",
      title: "Preflight",
      detail: "Logins and the admin key are checked before anything is issued. All of this is mocked.",
      tone: "ok",
      focus: "vault",
      log: [
        `✓ 1Password vault "${VAULT_NAME}" (mock)`,
        `✓ rekey.openai-admin in "${ADMIN_VAULT_NAME}" — issue can be automatic (mock)`,
        "✓ vercel whoami (mock)",
        "✓ supabase projects list (mock)",
        "✓ gh auth status (mock)",
      ],
    },
    { kind: "none" },
  );

  push(
    draft,
    {
      id: "summary",
      title: "Summary",
      detail:
        "Automatic keys go first, browser steps next, database passwords last. shop.openai is automatic. Places are written in template-path order.",
      tone: "info",
      focus: null,
      log: [
        "Keys to rotate: 1. Each gets a new key, then every place that uses it is updated.",
        "• Automatic: 1 — just wait",
        `• Places that change: ${order.length}`,
        `• Order: ${order.map((target) => target.kind).join(" → ")}`,
        "note: checkout assistant — lab fixture, not a real key",
      ],
    },
    { kind: "none" },
  );

  push(
    draft,
    {
      id: "issue",
      title: "Issue shop.openai",
      detail: "OpenAI admin API issues a project service-account key. The lab skips the network and mints a fake sk-proj value.",
      tone: "ok",
      focus: "issuer",
      log: [
        "[1/1] shop.openai  OpenAI",
        "✓ new key issued",
        "✓ the new key works",
        `name ${ISSUED_KEY_NAME}`,
        `value ${maskedNew}`,
      ],
    },
    { kind: "issue" },
  );

  push(
    draft,
    {
      id: "vault-save",
      title: "Save to 1Password",
      detail: "The new value becomes credential. The old value stays in previous until revoke.",
      tone: "ok",
      focus: "vault",
      log: [
        "✓ saved to 1Password (the old value is kept until it is revoked)",
        `credential ${maskedNew}`,
        `previous ${maskedOld}`,
      ],
    },
    { kind: "vault-save" },
  );

  const writeFailures: string[] = [];
  for (const spec of order) {
    const failed = options.failWriteRel === spec.rel;
    if (failed) {
      const reason = "mock write refused";
      writeFailures.push(spec.rel);
      push(
        draft,
        {
          id: `write-${spec.id}`,
          title: `Write ${spec.title}`,
          detail: `${spec.blurb} This write failed. rekey keeps going and prints a resync command at the end.`,
          tone: "error",
          focus: spec.id,
          log: [`✗ targets/${spec.rel}.tpl: ${reason}`, spec.variable],
          diff: diffFor(draft.world, spec.id, draft.world.targets[spec.id].stored),
        },
        { kind: "write-failed", targetId: spec.id, reason },
      );
      continue;
    }
    const before = draft.world.targets[spec.id];
    push(
      draft,
      {
        id: `write-${spec.id}`,
        title: `Write ${spec.title}`,
        detail: spec.blurb,
        tone: "ok",
        focus: spec.id,
        log: [`✓ ${spec.rel}  ${spec.variable}`, `${maskSecret(before.stored)} → ${maskedNew}`],
        diff: diffFor(draft.world, spec.id, NEW_CREDENTIAL),
      },
      { kind: "write", targetId: spec.id, value: NEW_CREDENTIAL },
    );
  }

  const vercelWriteFailed = writeFailures.includes(targetById("vercel").rel);
  const deployProblems: string[] = [];

  if (!vercelWriteFailed) {
    push(
      draft,
      {
        id: "redeploy-ask",
        title: "Ask to redeploy",
        detail:
          "rekey defaults to no, because a restart can drop live sessions. This playground answers yes so the redeploy is visible. Supabase already applied. GitHub waits for the next run. The .env file does not redeploy.",
        tone: "info",
        focus: "vercel",
        log: [
          "The new values are set. Each service picks them up when it redeploys. One at a time (default: no):",
          "Redeploy vercel/shop/production now? y   ← playground, not the CLI default",
        ],
      },
      { kind: "none" },
    );

    push(
      draft,
      {
        id: "redeploy-start",
        title: "Redeploy Vercel",
        detail: "Force a new production deployment from the current ready one and poll readyState.",
        tone: "info",
        focus: "vercel",
        log: [
          "Redeploying: 1 — waiting until done",
          "POST /v13/deployments?forceNew=1 (mock)",
          "deployment dpl_FAKE_lab_01",
          "vercel/shop: BUILDING",
        ],
      },
      { kind: "deploy-start", targetId: "vercel" },
    );

    if (options.vercelRedeployFails) {
      deployProblems.push("vercel/shop: deploy failed");
      push(
        draft,
        {
          id: "redeploy-result",
          title: "Vercel redeploy failed",
          detail:
            "The env var already holds the new key. The running deployment still has the old one loaded. rekey records the failure and does not stop to roll targets back by itself.",
          tone: "error",
          focus: "vercel",
          log: [
            "vercel/shop: ERROR",
            "✗ vercel/shop: deploy failed (ERROR) — check the logs",
            "mock injected: readyState ERROR",
            `stored ${maskedNew}`,
            `running ${maskedOld}`,
          ],
          diff: {
            ...diffFor(draft.world, "vercel", draft.world.targets.vercel.stored),
            before: OLD_CREDENTIAL,
            after: NEW_CREDENTIAL,
            loaded: draft.world.targets.vercel.loaded,
          },
        },
        { kind: "deploy-finish", targetId: "vercel", ok: false },
      );
    } else {
      push(
        draft,
        {
          id: "redeploy-result",
          title: "Vercel deploy healthy",
          detail: "readyState READY. The running deployment now has the new key.",
          tone: "ok",
          focus: "vercel",
          log: ["vercel/shop: READY", "✓ vercel/shop: deploy healthy", `running ${maskedNew}`],
        },
        { kind: "deploy-finish", targetId: "vercel", ok: true },
      );
    }
  }

  const problems = [
    ...writeFailures.map((rel) => `shop.openai → ${rel}: mock write refused`),
    ...deployProblems,
  ];
  const resultLog = ["Result", `✓ Rotated: 1`];
  if (writeFailures.length > 0) {
    resultLog.push("The new keys are saved. Fix the cause above, then write only the failed places again:");
    resultLog.push(`rekey sync ${writeFailures.map((rel) => `targets/${rel}.tpl`).join(" ")}`);
  }
  for (const problem of problems) {
    resultLog.push(`✗ ${problem}`);
  }
  const everywhere = true;
  resultLog.push(
    everywhere
      ? "When you are sure, revoke the old keys: rekey revoke shop.openai"
      : "After the deploys, revoke the old keys: rekey revoke shop.openai",
  );
  if (problems.length > 0) {
    resultLog.push("Lab: revoke was not asked. rekey only asks when there are no problems.");
  } else {
    resultLog.push("Lab: revoke was not run. rekey's default answer is no.");
  }

  push(
    draft,
    {
      id: "result",
      title: problems.length > 0 ? "Result — revoke withheld" : "Result — old key kept",
      detail:
        problems.length > 0
          ? "Writes that succeeded stay. Undo (rekey undo) puts the previous value back, then deletes the new issuer key only after redeploys are healthy."
          : "Every place has the new value. The old key is still in previous until you revoke. Undo is still available.",
      tone: problems.length > 0 ? "error" : "ok",
      focus: problems.length > 0 ? "vercel" : "vault",
      log: resultLog,
      snapshot: snapshot(draft.world),
    },
    { kind: "none" },
  );

  return { steps: draft.steps, frames: draft.frames };
}

export function planUndo(world: World): Plan {
  const draft: Draft = { world: cloneWorld(world), steps: [], frames: [] };
  if (!world.vault.previous || !world.vault.revoke) {
    push(
      draft,
      {
        id: "undo-empty",
        title: "Nothing to undo",
        detail: "Only keys that were rotated and not yet revoked can go back.",
        tone: "info",
        focus: "vault",
        log: ["Nothing to undo: only keys rotated and not yet revoked can go back."],
      },
      { kind: "none" },
    );
    return { steps: draft.steps, frames: draft.frames };
  }

  const restored = world.vault.previous;
  const maskedRestored = maskSecret(restored);
  push(
    draft,
    {
      id: "undo-start",
      title: "Undo shop.openai",
      detail: "Before revoke: write the previous value everywhere, redeploy, then delete the new issuer key.",
      tone: "info",
      focus: "vault",
      log: ["Back to the old key: 1", "shop.openai"],
    },
    { kind: "none" },
  );

  let vercelRestoreFailed = false;
  for (const spec of targetsInPropagationOrder()) {
    const before = draft.world.targets[spec.id].stored;
    push(
      draft,
      {
        id: `undo-write-${spec.id}`,
        title: `Restore ${spec.title}`,
        detail: spec.blurb,
        tone: "ok",
        focus: spec.id,
        log: [`✓ ${spec.rel}  ${spec.variable}`, `${maskSecret(before)} → ${maskedRestored}`],
        diff: diffFor(draft.world, spec.id, restored),
      },
      { kind: "restore", targetId: spec.id, value: restored },
    );
    if (spec.id === "vercel" && draft.world.targets.vercel.writeError) {
      vercelRestoreFailed = true;
    }
  }

  push(
    draft,
    {
      id: "undo-vault",
      title: "Swap the vault record",
      detail:
        "credential is the old key again. previous is the new key, and undo is set so a later revoke deletes the new one.",
      tone: "ok",
      focus: "vault",
      log: [
        `credential ${maskedRestored}`,
        `previous ${maskSecret(NEW_CREDENTIAL)}  (now the one to delete)`,
        "state.undo = true",
      ],
    },
    { kind: "vault-undo" },
  );

  if (!vercelRestoreFailed) {
    push(
      draft,
      {
        id: "undo-redeploy",
        title: "Redeploy restored Vercel",
        detail:
          "Failure injection applies only to the forward rotate. This second redeploy succeeds, so the running deployment matches the restored env var.",
        tone: "ok",
        focus: "vercel",
        log: [
          "Redeploy vercel/shop/production now? y",
          "vercel/shop: BUILDING",
          "vercel/shop: READY",
          "✓ vercel/shop: deploy healthy",
        ],
      },
      { kind: "deploy-finish", targetId: "vercel", ok: true },
    );
    push(
      draft,
      {
        id: "undo-delete",
        title: "Delete the new issuer key",
        detail: "Redeploy is healthy, so undo revokes the key rekey just issued. The original key stays.",
        tone: "ok",
        focus: "issuer",
        log: [
          `Delete the new key ${maskSecret(NEW_CREDENTIAL)} (the old one stays)`,
          "✓ deleted the new key",
        ],
        snapshot: undefined,
      },
      { kind: "delete-issued" },
    );
    const last = draft.steps[draft.steps.length - 1];
    if (last) {
      last.snapshot = snapshot(draft.world);
    }
  }

  return { steps: draft.steps, frames: draft.frames };
}

export function canUndo(world: World): boolean {
  return world.vault.previous !== null && world.vault.revoke !== null;
}
