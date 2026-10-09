type TopBarProps = {
  source: 'sample' | 'openai' | 'anthropic'
  model?: string
  exporting: boolean
  exportProgress: string | null
  onExport: () => void
}

export function TopBar({ source, model, exporting, exportProgress, onExport }: TopBarProps) {
  const sourceLabel =
    source === 'sample' ? 'sample · offline' : model ? `${source} · ${model}` : source

  return (
    <header className="flex items-center justify-between border-b border-line px-4">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
          Opus Motion Studio
        </h1>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-mute">
          seek(t) → mp4
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-[11px] text-mute">{sourceLabel}</span>
        {exportProgress && (
          <span className="font-mono text-[11px] text-accent">{exportProgress}</span>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={exporting}
          className="h-8 rounded-sm bg-accent px-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-black disabled:opacity-50"
        >
          {exporting ? 'Exporting' : 'Export MP4'}
        </button>
      </div>
    </header>
  )
}
