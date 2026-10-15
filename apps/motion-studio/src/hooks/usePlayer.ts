import { useEffect, useRef, useState } from 'react'

export function usePlayer(duration: number) {
  const [playing, setPlaying] = useState(true)
  const [t, setT] = useState(0)
  const durationRef = useRef(duration)
  durationRef.current = duration

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        const next = prev + dt
        const dur = durationRef.current
        if (dur <= 0) return 0
        return next >= dur ? next % dur : next
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const seekTo = (next: number) => {
    const dur = durationRef.current
    if (dur <= 0) {
      setT(0)
      return
    }
    setT(((next % dur) + dur) % dur)
  }

  const toggle = () => setPlaying((value) => !value)

  return { t, setT: seekTo, playing, setPlaying, toggle }
}
