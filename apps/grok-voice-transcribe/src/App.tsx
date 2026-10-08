import { ModeBadge } from "@/domains/transcribe/components/ModeBadge"
import { Playground } from "@/domains/transcribe/components/Playground"
import { MODEL_ID } from "@/domains/transcribe/constants"

export default function App() {
  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs tracking-[0.22em] text-amber-200/80 uppercase">xAI Speech to Text</p>
            <h1 className="text-3xl font-semibold tracking-tight">Grok Voice Transcribe 2.0</h1>
          </div>
          <ModeBadge />
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Single-user playground for <code className="rounded bg-white/5 px-1.5 py-0.5">{MODEL_ID}</code>.
          Record or upload audio, then inspect word timestamps, speaker labels, and detected language. The
          Bun proxy keeps <code className="rounded bg-white/5 px-1.5 py-0.5">XAI_API_KEY</code> off the
          client and falls back to a realistic demo transcript when the key is unset.
        </p>
      </header>
      <Playground />
    </main>
  )
}
