import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { targetsInPropagationOrder, type TargetId } from "@/domain/fixture.ts";
import { ITEM_NAME, OP_REF, VAULT_NAME } from "@/domain/secrets.ts";
import type { FocusId, TargetPhase, World } from "@/domain/types.ts";
import { cn } from "@/lib/utils.ts";
import { Secret } from "./Secret.tsx";

const PHASE_LABEL: Record<TargetPhase, string> = {
  steady: "in sync",
  written: "written, not live",
  deploying: "redeploying",
  live: "live",
  "deploy-failed": "redeploy failed",
  restored: "restored",
};

interface Edge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hot: boolean;
  bad: boolean;
}

function nodeClass(active: boolean, phase?: TargetPhase): string {
  const ring = active ? "ring-2" : "ring-1";
  if (phase === "deploy-failed") {
    return cn(ring, "ring-destructive bg-destructive/10");
  }
  if (phase === "deploying") {
    return cn(ring, "ring-primary animate-pulse");
  }
  if (phase === "live" || phase === "restored") {
    return cn(ring, "ring-success/80");
  }
  if (phase === "written") {
    return cn(ring, "ring-primary/80");
  }
  if (active) {
    return cn(ring, "ring-primary");
  }
  return cn(ring, "ring-foreground/15");
}

export function DependencyGraph({ world, focus }: { world: World; focus: FocusId }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edge[]>([]);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const bounds = root.getBoundingClientRect();
    const point = (id: string, side: "left" | "right") => {
      const element = root.querySelector(`[data-node="${id}"]`);
      if (!(element instanceof HTMLElement)) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return {
        x: (side === "right" ? rect.right : rect.left) - bounds.left,
        y: rect.top + rect.height / 2 - bounds.top,
      };
    };
    const next: Edge[] = [];
    const issuer = point("issuer", "right");
    const vaultLeft = point("vault", "left");
    const vaultRight = point("vault", "right");
    if (issuer && vaultLeft) {
      next.push({
        id: "issue",
        x1: issuer.x,
        y1: issuer.y,
        x2: vaultLeft.x,
        y2: vaultLeft.y,
        hot: focus === "issuer" || focus === "vault",
        bad: false,
      });
    }
    if (vaultRight) {
      for (const spec of targetsInPropagationOrder()) {
        const left = point(spec.id, "left");
        if (!left) {
          continue;
        }
        const phase = world.targets[spec.id].phase;
        const moved = phase !== "steady";
        next.push({
          id: spec.id,
          x1: vaultRight.x,
          y1: vaultRight.y,
          x2: left.x,
          y2: left.y,
          hot: focus === spec.id || moved,
          bad: phase === "deploy-failed",
        });
      }
    }
    setEdges(next);
  }, [focus, world]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div ref={rootRef} data-testid="graph" className="relative grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center">
      <article
        data-node="issuer"
        className={cn("rounded-xl bg-card p-3", nodeClass(focus === "issuer"))}
      >
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Issuer</p>
        <h3 className="font-medium">OpenAI · mock</h3>
        <ul className="mt-2 space-y-1 text-xs">
          {world.issuer.keys.map((key) => (
            <li key={key.id} className={cn("flex items-center justify-between gap-2", key.status === "deleted" && "opacity-50")}>
              <Secret value={key.secret} />
              <span className="text-muted-foreground">{key.status}</span>
            </li>
          ))}
        </ul>
      </article>

      <article
        data-node="vault"
        className={cn("rounded-xl bg-card p-3", nodeClass(focus === "vault"))}
      >
        <p className="text-xs tracking-wide text-muted-foreground uppercase">1Password · mock</p>
        <h3 className="font-medium">{VAULT_NAME}</h3>
        <p className="text-xs text-muted-foreground">{ITEM_NAME}</p>
        <dl className="mt-2 space-y-1 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">credential</dt>
            <dd><Secret value={world.vault.current} /></dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">previous</dt>
            <dd>{world.vault.previous ? <Secret value={world.vault.previous} /> : "—"}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] text-muted-foreground">{OP_REF}</p>
      </article>

      <div className="grid gap-3">
        {targetsInPropagationOrder().map((spec) => (
          <TargetNode key={spec.id} id={spec.id} world={world} focus={focus} />
        ))}
      </div>

      <svg className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        {edges.map((edge) => {
          const mid = (edge.x1 + edge.x2) / 2;
          const stroke = edge.bad ? "var(--destructive)" : edge.hot ? "var(--primary)" : "var(--border)";
          return (
            <path
              key={edge.id}
              d={`M ${edge.x1} ${edge.y1} C ${mid} ${edge.y1}, ${mid} ${edge.y2}, ${edge.x2} ${edge.y2}`}
              fill="none"
              stroke={stroke}
              strokeWidth={edge.hot ? 2 : 1}
            />
          );
        })}
      </svg>
    </div>
  );
}

function TargetNode({ id, world, focus }: { id: TargetId; world: World; focus: FocusId }) {
  const spec = targetsInPropagationOrder().find((target) => target.id === id);
  if (!spec) {
    return null;
  }
  const runtime = world.targets[id];
  const loadedDiffers = runtime.loaded !== runtime.stored;
  return (
    <article
      data-node={id}
      data-phase={runtime.phase}
      data-testid={`target-${id}`}
      className={cn("rounded-xl bg-card p-3", nodeClass(focus === id, runtime.phase))}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium">{spec.title}</h3>
        <span className="text-[11px] text-muted-foreground">{PHASE_LABEL[runtime.phase]}</span>
      </div>
      <p className="truncate text-[11px] text-muted-foreground">targets/{spec.rel}.tpl</p>
      <p className="mt-1 text-xs">
        <span className="text-muted-foreground">stored </span>
        <Secret value={runtime.stored} />
      </p>
      {loadedDiffers ? (
        <p className="text-xs">
          <span className="text-muted-foreground">running </span>
          <Secret value={runtime.loaded} />
        </p>
      ) : null}
      {spec.plainLines.map((line) => (
        <p key={line.key} className="text-[11px] text-muted-foreground">
          {line.key} unchanged
        </p>
      ))}
    </article>
  );
}
