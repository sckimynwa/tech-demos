import { LoaderCircle, Phone, PhoneOff } from "lucide-react";
import { DotBlob } from "@/components/DotBlob";
import { Button } from "@/components/ui/button";
import type { CallState, MicState, VoiceMode } from "@/domains/voice/types";

type CallStageProps = {
  mode: VoiceMode;
  callState: CallState;
  micState: MicState;
  caption: string;
  error: string | null;
  runningCount: number;
  onStart: () => void;
  onHangUp: () => void;
};

export function CallStage({
  mode,
  callState,
  micState,
  caption,
  error,
  runningCount,
  onStart,
  onHangUp,
}: CallStageProps) {
  const isLive = callState === "live";
  const isConnecting = callState === "connecting";

  return (
    <section className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#f6e6d8]/70">
          {mode === "realtime" ? "Realtime API" : "Simulated path"}
        </span>
        {isLive ? (
          <span className="rounded-full bg-[#3dcf8e]/15 px-3 py-1 text-[#7dffc0]">
            Always-on call
          </span>
        ) : null}
        {runningCount > 0 ? (
          <span className="rounded-full bg-[#f4b183]/15 px-3 py-1 text-[#f4b183]">
            {runningCount} in background
          </span>
        ) : null}
      </div>

      <DotBlob callState={callState} micState={micState} />

      <p className="max-w-xl text-center text-lg leading-relaxed text-[#f6e6d8]">
        {caption}
      </p>

      {error ? (
        <p className="max-w-md text-center text-sm text-[#ff8d8d]">{error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        {isLive ? (
          <Button variant="hangup" size="icon" onClick={onHangUp} aria-label="Hang up">
            <PhoneOff className="size-6" />
          </Button>
        ) : (
          <Button
            variant="call"
            size="lg"
            onClick={onStart}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Phone className="size-5" />
            )}
            {isConnecting ? "Connecting" : "Start call"}
          </Button>
        )}
      </div>
      <p className="max-w-sm text-center text-xs leading-5 text-[#f6e6d8]/45">
        Leave the call up. Speak (or type) work anytime. The agent queues
        research, summaries, and file writes, then barges in and speaks the
        result first.
      </p>
    </section>
  );
}
