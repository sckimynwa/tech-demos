import { useEffect, useRef } from 'react'
import { formatTimecode } from '../lib/motion.ts'
import { seek } from '../lib/renderer.ts'
import type { Scene } from '../lib/scene.ts'

type PreviewStageProps = {
  scene: Scene
  t: number
  playing: boolean
  onSeek: (t: number) => void
  onToggle: () => void
}

export function PreviewStage({ scene, t, playing, onSeek, onToggle }: PreviewStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return
    if (canvas.width !== scene.width) canvas.width = scene.width
    if (canvas.height !== scene.height) canvas.height = scene.height
    let cancelled = false
    seek(ctx, scene, t)
    void document.fonts?.ready.then(() => {
      if (!cancelled) seek(ctx, scene, t)
    })
    return () => {
      cancelled = true
    }
  }, [scene, t])

  const progress = scene.duration > 0 ? t / scene.duration : 0

  return (
    <section className="flex min-h-0 min-w-0 flex-col items-center justify-center gap-3 overflow-hidden bg-black/40 px-5 py-4">
      <div className="w-full max-w-[920px]">
        <div className="overflow-hidden rounded-sm border border-line bg-black shadow-[0_0_0_1px_#111]">
          <canvas
            ref={canvasRef}
            className="block aspect-video w-full bg-black"
            width={scene.width}
            height={scene.height}
          />
        </div>
        <div className="mt-3 grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="h-8 rounded-sm border border-line px-2 font-mono text-[11px] text-ink hover:border-accent hover:text-accent"
          >
            {playing ? 'Pause' : 'Play'}
          </button>
          <div>
            <div className="relative h-6">
              <input
                type="range"
                min={0}
                max={scene.duration}
                step={1 / scene.fps}
                value={t}
                onChange={(event) => onSeek(Number(event.target.value))}
                className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent"
              />
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-mute">
              {scene.shots.map((shot) => (
                <button
                  key={`${shot.t}-${shot.label}`}
                  type="button"
                  onClick={() => onSeek(shot.t)}
                  className="hover:text-accent"
                >
                  {shot.label}
                </button>
              ))}
            </div>
          </div>
          <div className="whitespace-nowrap text-right font-mono text-[11px] text-mute">
            {formatTimecode(t)} / {formatTimecode(scene.duration)}
            <div>
              {scene.width}×{scene.height} · {scene.fps} fps
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
