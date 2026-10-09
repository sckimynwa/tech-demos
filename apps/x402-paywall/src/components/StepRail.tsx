import { cn } from "@/lib/cn";

export const PROTOCOL_STEPS = [
  { id: "request", label: "Request" },
  { id: "quote", label: "402" },
  { id: "sign", label: "Pay" },
  { id: "retry", label: "Retry" },
  { id: "resource", label: "Resource" },
] as const;

export type ProtocolStepId = (typeof PROTOCOL_STEPS)[number]["id"];

type StepRailProps = {
  current: ProtocolStepId;
};

const ORDER: ProtocolStepId[] = ["request", "quote", "sign", "retry", "resource"];

export function StepRail({ current }: StepRailProps) {
  const currentIndex = ORDER.indexOf(current);

  return (
    <ol className="grid grid-cols-5 border-y border-line bg-panel/70">
      {PROTOCOL_STEPS.map((step, index) => {
        const isCurrent = step.id === current;
        const isDone = index < currentIndex;
        return (
          <li
            key={step.id}
            className={cn(
              "flex flex-col gap-1 border-r border-line px-3 py-3 last:border-r-0",
              isCurrent && "bg-amber-dim/70",
              isDone && "bg-mint-dim/40",
            )}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-sm",
                isCurrent && "text-amber",
                isDone && "text-mint",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
