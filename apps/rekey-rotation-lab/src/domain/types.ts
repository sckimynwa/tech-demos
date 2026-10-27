import type { PlainLine, TargetId } from "./fixture.ts";

export type TargetPhase =
  | "steady"
  | "written"
  | "deploying"
  | "live"
  | "deploy-failed"
  | "restored";

export interface TargetRuntime {
  stored: string;
  loaded: string;
  phase: TargetPhase;
  writeError: string | null;
}

export interface VaultState {
  name: string;
  item: string;
  current: string;
  previous: string | null;
  /** Set while the previous credential still has to be revoked. */
  revoke: { credential: string } | null;
  undo: boolean;
}

export type IssuerKeyStatus = "active" | "pending-revoke" | "deleted";

export interface IssuerKey {
  id: string;
  secret: string;
  name: string;
  status: IssuerKeyStatus;
}

export interface IssuerState {
  label: string;
  keys: IssuerKey[];
}

export interface World {
  vault: VaultState;
  issuer: IssuerState;
  targets: Record<TargetId, TargetRuntime>;
}

export type FocusId = "issuer" | "vault" | TargetId | null;

export type StepTone = "ok" | "error" | "info";

export interface StepDiff {
  targetId: TargetId;
  variable: string;
  before: string;
  after: string;
  loaded: string;
  plainUnchanged: PlainLine[];
}

export interface TargetSnapshot {
  id: TargetId;
  stored: string;
  loaded: string;
  phase: TargetPhase;
}

export interface LabStep {
  id: string;
  title: string;
  detail: string;
  tone: StepTone;
  focus: FocusId;
  log: string[];
  diff?: StepDiff;
  snapshot?: TargetSnapshot[];
}

export interface Plan {
  steps: LabStep[];
  frames: World[];
}

export type Patch =
  | { kind: "none" }
  | { kind: "issue" }
  | { kind: "vault-save" }
  | { kind: "write"; targetId: TargetId; value: string }
  | { kind: "write-failed"; targetId: TargetId; reason: string }
  | { kind: "restore"; targetId: TargetId; value: string }
  | { kind: "deploy-start"; targetId: TargetId }
  | { kind: "deploy-finish"; targetId: TargetId; ok: boolean }
  | { kind: "vault-undo" }
  | { kind: "delete-issued" };
