import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.ts";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
        variant === "primary" &&
          "bg-accent text-black hover:bg-[#88d000]",
        variant === "ghost" &&
          "border border-line bg-panel text-ink hover:border-accent/50",
        variant === "danger" &&
          "bg-deny/15 text-deny hover:bg-deny/25",
        variant === "quiet" &&
          "text-muted hover:bg-white/5 hover:text-ink",
        className,
      )}
      {...props}
    />
  );
}
