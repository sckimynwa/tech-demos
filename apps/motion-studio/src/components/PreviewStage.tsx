import { useEffect, useRef } from 'react'
import { formatTimecode } from '../lib/motion.ts'
import { seek } from '../lib/renderer.ts'
import type { Scene } from '../lib/scene.ts'

type PreviewStageProps = {
  scene: Scene
  t: number
  playing: boolean
  onToggle: () => void
}

export function PreviewStage({ scene, t, playing, onToggle }: PreviewStageProps) {
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) return
      if (event.code === 'Space') {
        event.preventDefault()
        onToggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onToggle])

  return (
    <section className="flex min-w-0 flex-col items-center justify-center gap-3 bg-black/40 px-6">
      <div className="w-full max-w-[960px] overflow-hidden rounded-sm border border-line bg-black shadow-[0_0_0_1px_#111]">
        <canvas
          ref={canvasRef}
          className="block aspect-video w-full bg-black"
          width={scene.width}
          height={scene.height}
        />
      </div>
      <div className="flex w-full max-w-[960px] items-center justify-between font-mono text-[11px] text-mute">
        <button
          type="button"
          onClick={onToggle}
          className="rounded-sm border border-line px-2 py-1 text-ink hover:border-accent hover:text-accent"
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <span>
          {formatTimecode(t)} / {formatTimecode(scene.duration)}
        </span>
        <span>
          {scene.width}×{scene.height} · {scene.fps} fps · space
        </span>
      </div>
    </section>
  )
}
