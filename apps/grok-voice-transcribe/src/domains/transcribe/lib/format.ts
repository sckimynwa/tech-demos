export function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0")
  const seconds = String(totalSeconds % 60).padStart(2, "0")
  return `${minutes}:${seconds}`
}

export function formatSeconds(value: number) {
  return `${value.toFixed(2)}s`
}

export function speakerLabel(index: number | undefined) {
  if (index === undefined) return "Speaker"
  return `Speaker ${index}`
}
