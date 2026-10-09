import { FileCode2, Globe, KeyRound, Plug } from "lucide-react";
import { useMemo, useState } from "react";
import { presetsFor } from "../gateway/presets.ts";
import {
  DEFAULT_MCP_BINARY,
  DEFAULT_NETWORK_BINARY,
  type ActionKind,
  type AgentAction,
} from "../gateway/types.ts";
import { cn } from "../lib/cn.ts";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";

const KINDS: { id: ActionKind; label: string; icon: typeof FileCode2 }[] = [
  { id: "file", label: "File", icon: FileCode2 },
  { id: "network", label: "Network", icon: Globe },
  { id: "mcp", label: "MCP", icon: Plug },
  { id: "credentials", label: "Creds", icon: KeyRound },
];

type ActionPanelProps = {
  busy: boolean;
  onFire: (action: AgentAction) => void;
};

type CustomState = {
  fileOp: "read" | "write";
  filePath: string;
  method: string;
  host: string;
  port: string;
  path: string;
  binary: string;
  mcpMethod: string;
  tool: string;
  key: string;
};

const INITIAL_CUSTOM: CustomState = {
  fileOp: "read",
  filePath: "/workspace/src/main.ts",
  method: "GET",
  host: "api.github.com",
  port: "443",
  path: "/repos/NVIDIA/OpenShell",
  binary: DEFAULT_NETWORK_BINARY,
  mcpMethod: "tools/call",
  tool: "search_messages",
  key: "GITHUB_TOKEN",
};

function expectTone(expect: "allow" | "deny" | "audit") {
  if (expect === "allow") return "allow" as const;
  if (expect === "deny") return "deny" as const;
  return "audit" as const;
}

export function ActionPanel({ busy, onFire }: ActionPanelProps) {
  const [kind, setKind] = useState<ActionKind>("file");
  const [custom, setCustom] = useState<CustomState>(INITIAL_CUSTOM);
  const presets = useMemo(() => presetsFor(kind), [kind]);

  function fireCustom() {
    const port = Number(custom.port) || 443;
    if (kind === "file") {
      onFire({ kind: "file", op: custom.fileOp, path: custom.filePath });
      return;
    }
    if (kind === "network") {
      onFire({
        kind: "network",
        method: custom.method,
        host: custom.host,
        port,
        path: custom.path,
        protocol: "rest",
        binary: custom.binary || DEFAULT_NETWORK_BINARY,
      });
      return;
    }
    if (kind === "mcp") {
      onFire({
        kind: "mcp",
        host: custom.host || "mcp.slack.com",
        port,
        path: custom.path || "/mcp",
        method: custom.mcpMethod,
        tool: custom.tool || undefined,
        binary: custom.binary || DEFAULT_MCP_BINARY,
      });
      return;
    }
    onFire({
      kind: "credentials",
      host: custom.host,
      port,
      path: custom.path || "/",
      key: custom.key,
      binary: custom.binary || DEFAULT_NETWORK_BINARY,
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-1.5">
        {KINDS.map((item) => {
          const Icon = item.icon;
          const active = kind === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium",
                active
                  ? "border-accent/50 bg-accent/10 text-ink"
                  : "border-line bg-black/20 text-muted hover:text-ink",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            disabled={busy}
            onClick={() => onFire(preset.action)}
            className="flex items-center justify-between gap-3 rounded-md border border-line bg-black/20 px-3 py-2 text-left hover:border-accent/40 disabled:opacity-50"
          >
            <span>
              <span className="block text-sm">{preset.label}</span>
              <span className="block font-mono text-[11px] text-muted">
                {preset.detail}
              </span>
            </span>
            <Badge tone={expectTone(preset.expect)}>{preset.expect}</Badge>
          </button>
        ))}
      </div>

      <details className="rounded-md border border-line bg-black/15 px-3 py-2">
        <summary className="cursor-pointer text-xs uppercase tracking-[0.14em] text-muted">
          Custom action
        </summary>
        <div className="mt-3 grid gap-2">
          {kind === "file" ? (
            <div className="grid grid-cols-[88px_1fr] gap-2">
              <select
                value={custom.fileOp}
                onChange={(event) =>
                  setCustom((prev) => ({
                    ...prev,
                    fileOp: event.target.value as "read" | "write",
                  }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
              >
                <option value="read">read</option>
                <option value="write">write</option>
              </select>
              <input
                value={custom.filePath}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, filePath: event.target.value }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
              />
            </div>
          ) : null}

          {kind === "network" || kind === "mcp" || kind === "credentials" ? (
            <div className="grid grid-cols-2 gap-2">
              {kind === "network" ? (
                <input
                  value={custom.method}
                  onChange={(event) =>
                    setCustom((prev) => ({ ...prev, method: event.target.value }))
                  }
                  className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                  placeholder="GET"
                />
              ) : null}
              {kind === "mcp" ? (
                <input
                  value={custom.mcpMethod}
                  onChange={(event) =>
                    setCustom((prev) => ({ ...prev, mcpMethod: event.target.value }))
                  }
                  className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                  placeholder="tools/call"
                />
              ) : null}
              {kind === "credentials" ? (
                <input
                  value={custom.key}
                  onChange={(event) =>
                    setCustom((prev) => ({ ...prev, key: event.target.value }))
                  }
                  className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                  placeholder="GITHUB_TOKEN"
                />
              ) : null}
              <input
                value={custom.host}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, host: event.target.value }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                placeholder="host"
              />
              <input
                value={custom.port}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, port: event.target.value }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                placeholder="443"
              />
              <input
                value={custom.path}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, path: event.target.value }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                placeholder="/path"
              />
              {kind === "mcp" ? (
                <input
                  value={custom.tool}
                  onChange={(event) =>
                    setCustom((prev) => ({ ...prev, tool: event.target.value }))
                  }
                  className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs"
                  placeholder="tool"
                />
              ) : null}
              <input
                value={custom.binary}
                onChange={(event) =>
                  setCustom((prev) => ({ ...prev, binary: event.target.value }))
                }
                className="h-8 rounded border border-line bg-panel px-2 font-mono text-xs col-span-2"
                placeholder="binary"
              />
            </div>
          ) : null}

          <Button size="sm" variant="ghost" disabled={busy} onClick={fireCustom}>
            Fire custom
          </Button>
        </div>
      </details>
    </section>
  );
}
