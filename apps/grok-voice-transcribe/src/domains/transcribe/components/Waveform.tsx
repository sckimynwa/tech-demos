import { cn } from "@/lib/utils"

type WaveformProps = {
  levels: number[]
  active: boolean
}

export function Waveform({ levels, active }: WaveformProps) {
  return (
    <div
      className="flex h-16 items-end gap-0.5 rounded-lg bg-black/40 px-3 py-2"
      aria-hidden="true"
      data-testid="waveform"
    >
      {levels.map((level, index) => (
        <span
          key={index}
          className={cn(
            "w-1 rounded-full bg-amber-300/80 transition-[height] duration-75",
            !active && "bg-white/25",
          )}
          style={{ height: `${Math.max(8, level * 100)}%` }}
        />
      ))}
    </div>
  )
}
