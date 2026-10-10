import type { CallState, MicState } from "@/domains/voice/types";
import { cn } from "@/lib/utils";

type DotBlobProps = {
  callState: CallState;
  micState: MicState;
};

export function DotBlob({ callState, micState }: DotBlobProps) {
  const isLive = callState === "live";
  const isSpeaking = micState === "speaking";
  const isListening = isLive && micState === "listening";

  return (
    <div className="relative grid place-items-center">
      <div
        className={cn(
          "absolute size-64 rounded-full blur-3xl transition-opacity duration-500",
          isSpeaking ? "opacity-80 bg-[#ffb086]" : "opacity-40 bg-[#c4784f]",
          isListening && "animate-pulse",
        )}
      />
      <div
        className={cn(
          "relative grid size-44 place-items-center rounded-[44%] bg-[radial-gradient(circle_at_32%_28%,#ffe1cf,#f08a5d_58%,#c45b3a)] shadow-[inset_0_-18px_30px_rgba(80,20,10,0.28),0_18px_50px_rgba(0,0,0,0.35)]",
          isLive && "animate-[breathe_2.8s_ease-in-out_infinite]",
        )}
      >
        <div className="flex items-center gap-8 pb-2">
          <span className="size-3.5 rounded-full bg-[#2b1b14]" />
          <span className="size-3.5 rounded-full bg-[#2b1b14]" />
        </div>
        <div
          className={cn(
            "absolute bottom-12 h-1.5 w-8 rounded-full bg-[#2b1b14]/70 transition-all",
            isSpeaking && "w-12 h-2.5 rounded-[40%]",
          )}
        />
      </div>
      <p className="relative mt-6 text-sm tracking-[0.18em] uppercase text-[#f6e6d8]/55">
        {isSpeaking
          ? "Speaking results"
          : isListening
            ? "On the line"
            : callState === "connecting"
              ? "Connecting"
              : "Idle"}
      </p>
    </div>
  );
}
