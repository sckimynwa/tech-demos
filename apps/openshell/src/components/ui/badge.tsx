import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "allow" | "deny" | "audit" | "accent";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
        tone === "neutral" && "bg-white/5 text-muted",
        tone === "allow" && "bg-allow/15 text-allow",
        tone === "deny" && "bg-deny/15 text-deny",
        tone === "audit" && "bg-audit/15 text-audit",
        tone === "accent" && "bg-accent/15 text-accent",
        className,
      )}
      {...props}
    />
  );
}
