import { useEffect, useState } from "react";
import { ActionPanel } from "./components/ActionPanel.tsx";
import { AuditLog } from "./components/AuditLog.tsx";
import { Header } from "./components/Header.tsx";
import { PolicyEditor } from "./components/PolicyEditor.tsx";
import { VerdictStamp } from "./components/VerdictStamp.tsx";
import defaultPolicyYaml from "./gateway/defaultPolicy.yaml?raw";
import { parsePolicy } from "./gateway/parsePolicy.ts";
import type {
  AgentAction,
  GatewayResponse,
  PolicySummary,
} from "./gateway/types.ts";
import {
  GATEWAY_TIMEOUT_MS,
  HEALTH_POLL_MS,
  MAX_AUDIT_ENTRIES,
} from "./lib/constants.ts";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export default function App() {
  const [draft, setDraft] = useState(defaultPolicyYaml);
  const [applied, setApplied] = useState(defaultPolicyYaml);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PolicySummary | null>(() => {
    const parsed = parsePolicy(defaultPolicyYaml);
    return parsed.ok ? parsed.summary : null;
  });
  const [revision, setRevision] = useState(1);
  const [applying, setApplying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gatewayLive, setGatewayLive] = useState(false);
  const [last, setLast] = useState<GatewayResponse | null>(null);
  const [audit, setAudit] = useState<GatewayResponse[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function ping() {
      try {
        const response = await fetch("/api/health");
        const body = (await response.json()) as { ok?: boolean };
        if (!cancelled) setGatewayLive(Boolean(body.ok));
      } catch {
        if (!cancelled) setGatewayLive(false);
      }
    }

    void ping();
    const timer = setInterval(() => {
      void ping();
    }, HEALTH_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  async function applyPolicy() {
    setApplying(true);
    try {
      const result = await postJson<{
        ok: boolean;
        error?: string;
        summary?: PolicySummary;
      }>("/api/policy/validate", { policyYaml: draft });
      if (!result.ok || !result.summary) {
        setError(result.error ?? "invalid policy");
        return;
      }
      setApplied(draft);
      setSummary(result.summary);
      setError(null);
      setRevision((value) => value + 1);
    } catch (applyError) {
      const local = parsePolicy(draft);
      if (local.ok === false) {
        setError(local.error);
        return;
      }
      setApplied(draft);
      setSummary(local.summary);
      setError(null);
      setRevision((value) => value + 1);
      if (applyError instanceof Error) {
        setError(`gateway unreachable, applied locally: ${applyError.message}`);
      }
    } finally {
      setApplying(false);
    }
  }

  async function fireAction(action: AgentAction) {
    setBusy(true);
    try {
      const decision = await postJson<GatewayResponse>("/api/gateway", {
        policyYaml: applied,
        action,
      });
      setLast(decision);
      setAudit((entries) => [decision, ...entries].slice(0, MAX_AUDIT_ENTRIES));
    } catch (fireError) {
      const message =
        fireError instanceof Error ? fireError.message : "gateway error";
      const fallback: GatewayResponse = {
        id: `local_${Date.now()}`,
        ts: new Date().toISOString(),
        action,
        verdict: "deny",
        layer: "policy",
        reason: `gateway request failed: ${message}`,
      };
      setLast(fallback);
      setAudit((entries) => [fallback, ...entries].slice(0, MAX_AUDIT_ENTRIES));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header gatewayLive={gatewayLive} revision={revision} />
      <main className="grid min-h-0 flex-1 lg:h-[calc(100dvh-65px)] lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.9fr)] lg:overflow-hidden">
        <PolicyEditor
          value={draft}
          applied={applied}
          error={error}
          summary={summary}
          applying={applying}
          onChange={setDraft}
          onApply={() => {
            void applyPolicy();
          }}
        />
        <div className="flex min-h-[70vh] flex-col gap-4 overflow-hidden bg-panel-2/70 p-4 lg:min-h-0">
          <div className="max-h-[46%] min-h-0 overflow-auto">
            <ActionPanel busy={busy} onFire={(action) => void fireAction(action)} />
          </div>
          <VerdictStamp last={last} />
          <AuditLog entries={audit} onClear={() => setAudit([])} />
        </div>
      </main>
    </div>
  );
}
