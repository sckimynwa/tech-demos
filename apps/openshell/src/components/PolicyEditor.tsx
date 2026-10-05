import { useMemo } from "react";
import type { PolicySummary } from "../gateway/types.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

type PolicyEditorProps = {
  value: string;
  applied: string;
  error: string | null;
  summary: PolicySummary | null;
  applying: boolean;
  onChange: (next: string) => void;
  onApply: () => void;
};

export function PolicyEditor({
  value,
  applied,
  error,
  summary,
  applying,
  onChange,
  onApply,
}: PolicyEditorProps) {
  const dirty = value !== applied;
  const lineCount = useMemo(() => value.split("\n").length, [value]);

  return (
    <section className="flex min-h-[55vh] flex-1 flex-col border-r border-line bg-panel/90 lg:min-h-0">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
            policy.yaml
          </span>
          {dirty ? <Badge tone="audit">unapplied</Badge> : <Badge tone="allow">applied</Badge>}
        </div>
        <Button size="sm" onClick={onApply} disabled={applying}>
          {applying ? "Applying…" : "Apply policy"}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <pre
          id="policy-gutter"
          className="w-10 shrink-0 select-none overflow-hidden border-r border-line bg-black/20 px-2 py-3 text-right font-mono text-[12px] leading-5 text-muted/70 lg:min-h-0"
        >
          {Array.from({ length: lineCount }, (_, index) => index + 1).join("\n")}
        </pre>
        <textarea
          value={value}
          spellCheck={false}
          onScroll={(event) => {
            const gutter = document.getElementById("policy-gutter");
            if (gutter) gutter.scrollTop = event.currentTarget.scrollTop;
          }}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            event.preventDefault();
            const target = event.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const next = `${value.slice(0, start)}  ${value.slice(end)}`;
            onChange(next);
            requestAnimationFrame(() => {
              target.selectionStart = start + 2;
              target.selectionEnd = start + 2;
            });
          }}
          className="min-h-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[12px] leading-5 text-ink outline-none"
          aria-label="OpenShell policy YAML"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2 text-[11px]">
        {error ? (
          <span className="font-mono text-deny">{error}</span>
        ) : summary ? (
          <>
            <Badge>static fs {summary.readOnly + summary.readWrite}</Badge>
            <Badge>net {summary.networkRules}</Badge>
            <Badge>mcp {summary.mcpEndpoints}</Badge>
            <Badge>creds {summary.credentialBindings}</Badge>
            {summary.includeWorkdir ? <Badge tone="accent">workdir rw</Badge> : null}
          </>
        ) : (
          <span className="text-muted">Apply a valid policy to hot-reload the gateway.</span>
        )}
      </div>
    </section>
  );
}
