import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3b48a]/70 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#f4b183] text-[#2b1b14] hover:bg-[#ffc49a]",
        call: "bg-[#3dcf8e] text-[#062414] hover:bg-[#4ee09d] shadow-[0_0_24px_rgba(61,207,142,0.35)]",
        hangup: "bg-[#ef5d5d] text-white hover:bg-[#f36d6d] shadow-[0_0_24px_rgba(239,93,93,0.28)]",
        ghost: "bg-white/6 text-white/80 hover:bg-white/10",
        chip: "bg-[#221c24] text-[#f6e6d8] hover:bg-[#2c2430] border border-white/8",
      },
      size: {
        default: "h-10 px-4",
        lg: "h-14 px-6 text-base",
        sm: "h-8 px-3 text-xs",
        icon: "size-16",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
