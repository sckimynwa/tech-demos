import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "amber" | "mint" | "muted";
};

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  const tones = {
    amber: "border-amber/40 bg-amber-dim text-amber",
    mint: "border-mint/40 bg-mint-dim text-mint",
    muted: "border-line bg-panel text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
