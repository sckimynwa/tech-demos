import { formatTimecode } from '../lib/motion.ts'
import type { Scene } from '../lib/scene.ts'

type TimelineProps = {
  scene: Scene
  t: number
  onSeek: (t: number) => void
}

export function Timeline({ scene, t, onSeek }: TimelineProps) {
  const progress = scene.duration > 0 ? t / scene.duration : 0

  return (
    <footer className="border-t border-line px-4 py-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
        <span>Timeline</span>
        <span>{scene.shots.map((shot) => shot.label).join(' · ')}</span>
      </div>
      <div className="relative h-10">
        <input
          type="range"
          min={0}
          max={scene.duration}
          step={1 / scene.fps}
          value={t}
          onChange={(event) => onSeek(Number(event.target.value))}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent"
        />
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {scene.shots.map((shot) => (
          <button
            key={`${shot.t}-${shot.label}`}
            type="button"
            onClick={() => onSeek(shot.t)}
            className="absolute top-0 -translate-x-1/2 font-mono text-[9px] text-mute hover:text-accent"
            style={{ left: `${(shot.t / scene.duration) * 100}%` }}
          >
            {shot.label}
          </button>
        ))}
      </div>
      <div className="mt-1 font-mono text-[10px] text-mute">{formatTimecode(t)}</div>
    </footer>
  )
}
