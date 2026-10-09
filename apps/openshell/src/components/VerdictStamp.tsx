import type { GatewayResponse } from "../gateway/types.ts";
import { Badge } from "./ui/badge.tsx";

type VerdictStampProps = {
  last: GatewayResponse | null;
};

export function VerdictStamp({ last }: VerdictStampProps) {
  if (!last) {
    return (
      <div className="rounded-md border border-dashed border-line bg-black/20 px-3 py-4 text-sm text-muted">
        Fire a mock agent action. The gateway returns allow / deny here and appends the audit log.
      </div>
    );
  }

  const isAudit = Boolean(last.auditViolation);
  const tone = isAudit ? "audit" : last.verdict === "allow" ? "allow" : "deny";
  const word = isAudit ? "AUDIT" : last.verdict.toUpperCase();

  return (
    <div
      className={`rounded-md border px-3 py-3 ${
        tone === "allow"
          ? "border-allow/30 bg-allow/8"
          : tone === "deny"
            ? "border-deny/30 bg-deny/8"
            : "border-audit/30 bg-audit/8"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono text-2xl font-semibold tracking-[0.18em] ${
            tone === "allow"
              ? "text-allow"
              : tone === "deny"
                ? "text-deny"
                : "text-audit"
          }`}
        >
          {word}
        </span>
        <Badge tone={tone}>{last.layer}</Badge>
      </div>
      <p className="mt-2 text-sm leading-5 text-ink/90">{last.reason}</p>
      {last.matchedRule ? (
        <p className="mt-1 font-mono text-[11px] text-muted">{last.matchedRule}</p>
      ) : null}
    </div>
  );
}
