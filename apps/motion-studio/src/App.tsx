import { useEffect } from 'react'
import { Inspector } from './components/Inspector.tsx'
import { PreviewStage } from './components/PreviewStage.tsx'
import { PromptDock } from './components/PromptDock.tsx'
import { TopBar } from './components/TopBar.tsx'
import { useStudio } from './hooks/useStudio.ts'

export default function App() {
  const studio = useStudio()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return
      if (event.code === 'Space') {
        event.preventDefault()
        studio.player.toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [studio.player])

  return (
    <div className="studio-shell overflow-hidden bg-bg text-ink">
      <TopBar
        source={studio.source}
        model={studio.model}
        exporting={studio.exporting}
        exportProgress={studio.exportProgress}
        onExport={studio.exportMp4}
      />
      <div className="grid min-h-0 grid-cols-[280px_minmax(0,1fr)_260px]">
        <PromptDock
          prompt={studio.prompt}
          compiling={studio.compiling}
          error={studio.compileError}
          onPrompt={studio.setPrompt}
          onGenerate={studio.generate}
          onSample={studio.loadSample}
        />
        <PreviewStage
          scene={studio.scene}
          t={studio.player.t}
          playing={studio.player.playing}
          onSeek={studio.player.setT}
          onToggle={studio.player.toggle}
        />
        <Inspector
          scene={studio.scene}
          t={studio.player.t}
          exportError={studio.exportError}
        />
      </div>
    </div>
  )
}
