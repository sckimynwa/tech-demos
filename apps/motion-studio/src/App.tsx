import { Inspector } from './components/Inspector.tsx'
import { PreviewStage } from './components/PreviewStage.tsx'
import { PromptDock } from './components/PromptDock.tsx'
import { Timeline } from './components/Timeline.tsx'
import { TopBar } from './components/TopBar.tsx'
import { useStudio } from './hooks/useStudio.ts'

export default function App() {
  const studio = useStudio()

  return (
    <div className="grid h-dvh grid-rows-[52px_1fr_96px] bg-bg text-ink">
      <TopBar
        source={studio.source}
        model={studio.model}
        exporting={studio.exporting}
        exportProgress={studio.exportProgress}
        onExport={studio.exportMp4}
      />
      <div className="grid min-h-0 grid-cols-[300px_1fr_280px]">
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
          onToggle={studio.player.toggle}
        />
        <Inspector
          scene={studio.scene}
          t={studio.player.t}
          exportError={studio.exportError}
        />
      </div>
      <Timeline scene={studio.scene} t={studio.player.t} onSeek={studio.player.setT} />
    </div>
  )
}
