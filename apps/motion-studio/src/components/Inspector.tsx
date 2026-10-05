import { visibleLayerCount } from '../lib/compileOffline.ts'
import type { Scene } from '../lib/scene.ts'

type InspectorProps = {
  scene: Scene
  t: number
  exportError: string | null
}

export function Inspector({ scene, t, exportError }: InspectorProps) {
  const live = visibleLayerCount(scene, t)
  const json = JSON.stringify(
    {
      id: scene.id,
      duration: scene.duration,
      fps: scene.fps,
      accent: scene.accent,
      shots: scene.shots,
      layers: scene.layers.map((layer) => `${layer.kind}:${layer.id}`),
    },
    null,
    2,
  )

  return (
    <aside className="flex min-w-0 flex-col gap-3 border-l border-line p-4">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute">Scene</h2>
      <div className="grid grid-cols-2 gap-2 font-mono text-[11px] text-ink">
        <Meta label="id" value={scene.id} />
        <Meta label="layers" value={`${live} / ${scene.layers.length}`} />
        <Meta label="accent" value={scene.accent} />
        <Meta label="grain" value={scene.grain.toFixed(2)} />
      </div>
      <pre className="min-h-0 flex-1 overflow-auto rounded-sm border border-line bg-black/40 p-2 font-mono text-[10px] leading-relaxed text-mute">
        {json}
      </pre>
      {exportError && (
        <p className="font-mono text-[11px] text-red-400">Export: {exportError}</p>
      )}
    </aside>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.14em] text-mute">{label}</div>
      <div className="truncate text-ink">{value}</div>
    </div>
  )
}
