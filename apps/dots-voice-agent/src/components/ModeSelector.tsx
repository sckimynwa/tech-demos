import { Button } from "@/components/ui/button";
import type { VoiceMode } from "@/domains/voice/types";
import { cn } from "@/lib/utils";

const MODES: { id: VoiceMode; label: string }[] = [
  { id: "mock", label: "Mock" },
  { id: "realtime", label: "Realtime" },
  { id: "local", label: "Local" },
];

type ModeSelectorProps = {
  mode: VoiceMode;
  disabled: boolean;
  realtimeEnabled: boolean;
  onChange: (mode: VoiceMode) => void;
};

export function ModeSelector({
  mode,
  disabled,
  realtimeEnabled,
  onChange,
}: ModeSelectorProps) {
  return (
    <div
      data-testid="mode-selector"
      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/4 p-1"
    >
      {MODES.map((item) => {
        const locked = item.id === "realtime" && !realtimeEnabled;
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            data-testid={`mode-${item.id}`}
            disabled={disabled || locked}
            onClick={() => onChange(item.id)}
            className={cn(
              "h-7 px-3 text-xs",
              mode === item.id && "bg-white/12 text-[#f6e6d8]",
              locked && "opacity-40",
            )}
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
