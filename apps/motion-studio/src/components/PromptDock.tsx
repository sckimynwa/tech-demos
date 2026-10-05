import { SAMPLE_PROMPTS } from '../lib/compileOffline.ts'

type PromptDockProps = {
  prompt: string
  compiling: boolean
  error: string | null
  onPrompt: (value: string) => void
  onGenerate: () => void
  onSample: (prompt: string) => void
}

export function PromptDock({
  prompt,
  compiling,
  error,
  onPrompt,
  onGenerate,
  onSample,
}: PromptDockProps) {
  return (
    <aside className="flex flex-col gap-3 border-r border-line p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">Prompt</h2>
        <span className="font-mono text-[10px] text-mute/70">one shot</span>
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPrompt(event.target.value)}
        rows={8}
        className="min-h-[180px] resize-none rounded-sm border border-line bg-panel px-3 py-2 font-sans text-[13px] leading-relaxed text-ink outline-none focus:border-accent/60"
      />
      <div className="flex flex-wrap gap-1.5">
        {SAMPLE_PROMPTS.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSample(sample.prompt)}
            className="rounded-sm border border-line px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-mute hover:border-accent hover:text-accent"
          >
            {sample.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={compiling || prompt.trim().length === 0}
        className="h-9 rounded-sm border border-accent/40 bg-accent/10 font-mono text-[11px] uppercase tracking-[0.16em] text-accent disabled:opacity-50"
      >
        {compiling ? 'Compiling…' : 'Generate scene'}
      </button>
      {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
      <p className="mt-auto font-mono text-[10px] leading-relaxed text-mute/80">
        No API key: built-in sample compiler. Optional{' '}
        <span className="text-ink/70">OPENAI_API_KEY</span> or{' '}
        <span className="text-ink/70">ANTHROPIC_API_KEY</span> in{' '}
        <span className="text-ink/70">.env</span> for prompt → scene JSON.
      </p>
    </aside>
  )
}
