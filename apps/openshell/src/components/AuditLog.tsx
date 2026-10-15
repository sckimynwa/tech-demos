import type { GatewayResponse } from "../gateway/types.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

type AuditLogProps = {
  entries: GatewayResponse[];
  onClear: () => void;
};

function actionLine(entry: GatewayResponse): string {
  const { action } = entry;
  if (action.kind === "file") return `${action.op} ${action.path}`;
  if (action.kind === "network") {
    return `${action.method} ${action.host}${action.path}`;
  }
  if (action.kind === "mcp") {
    return `${action.method}${action.tool ? ` ${action.tool}` : ""} @ ${action.host}`;
  }
  return `resolve ${action.key} @ ${action.host}`;
}

export function AuditLog({ entries, onClear }: AuditLogProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          audit log
        </span>
        <Button size="sm" variant="quiet" onClick={onClear} disabled={entries.length === 0}>
          Clear
        </Button>
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-auto rounded-md border border-line bg-black/30">
        {entries.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted">
            Empty. Actions POST to /api/gateway and land here.
          </p>
        ) : (
          <ul className="divide-y divide-line/80">
            {entries.map((entry, index) => {
              const tone = entry.auditViolation
                ? "audit"
                : entry.verdict === "allow"
                  ? "allow"
                  : "deny";
              return (
                <li
                  key={entry.id}
                  className={`flex items-start justify-between gap-3 px-3 py-2 ${index === 0 ? "audit-row-enter" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={tone}>
                        {entry.auditViolation ? "audit" : entry.verdict}
                      </Badge>
                      <span className="truncate font-mono text-[11px] text-muted">
                        {new Date(entry.ts).toLocaleTimeString()} · {entry.layer}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-mono text-xs">{actionLine(entry)}</p>
                    <p className="truncate text-[11px] text-muted">{entry.reason}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
