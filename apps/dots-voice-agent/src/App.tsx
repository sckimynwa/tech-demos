import { ActivityTimeline } from "@/components/ActivityTimeline";
import { CallStage } from "@/components/CallStage";
import { SpeakBar } from "@/components/SpeakBar";
import { useVoiceAgent } from "@/domains/voice/useVoiceAgent";

export default function App() {
  const agent = useVoiceAgent();

  return (
    <div className="flex h-dvh flex-col bg-[#100e12] text-[#f6e6d8]">
      <header className="flex items-center justify-between border-b border-white/8 px-5 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#f4b183]">
            tech-demos
          </p>
          <h1 className="text-sm font-medium">dots-voice-agent</h1>
        </div>
        <p className="hidden text-xs text-white/40 sm:block">
          Dots pattern via Realtime API — not the Dots product
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <CallStage
          mode={agent.config.mode}
          callState={agent.callState}
          micState={agent.micState}
          caption={agent.caption}
          error={agent.error}
          runningCount={agent.runningCount}
          onStart={() => {
            void agent.startCall();
          }}
          onHangUp={agent.hangUp}
        />
        <ActivityTimeline events={agent.events} tasks={agent.tasks} />
      </div>

      <SpeakBar disabled={!agent.isOnCall} onSubmit={agent.submitUtterance} />
    </div>
  );
}
