import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-sm border px-3 py-2 text-sm font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "border-mint/40 bg-mint-dim text-mint hover:bg-[#184226]",
        amber:
          "border-amber/50 bg-amber-dim text-amber hover:bg-[#4a3510]",
        ghost:
          "border-line bg-transparent text-ink hover:bg-panel",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
