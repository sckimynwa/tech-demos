import { Shield } from "lucide-react";
import { Badge } from "./ui/badge.tsx";

type HeaderProps = {
  gatewayLive: boolean;
  revision: number;
};

export function Header({ gatewayLive, revision }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-panel-2/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md border border-accent/30 bg-accent/10">
          <Shield className="size-4 text-accent" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight">OpenShell</h1>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              policy playground
            </span>
          </div>
          <p className="text-xs text-muted">
            Mock gateway for file / network / MCP / credential actions. No Docker, no keys.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={gatewayLive ? "allow" : "deny"}>
          <span
            className={`size-1.5 rounded-full ${gatewayLive ? "bg-allow" : "bg-deny"}`}
          />
          {gatewayLive ? "gateway live" : "gateway down"}
        </Badge>
        <Badge>rev {revision}</Badge>
      </div>
    </header>
  );
}
