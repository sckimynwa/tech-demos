const WAV_HEADER_BYTES = 44
const FALLBACK_BITRATE = 16_000

export async function estimateDurationSeconds(file: File): Promise<number> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const wavDuration = readWavDuration(bytes)
  if (wavDuration !== null && wavDuration > 0) {
    return round2(wavDuration)
  }

  const estimated = file.size / FALLBACK_BITRATE
  return round2(Math.min(Math.max(estimated, 4), 120))
}

function readWavDuration(bytes: Uint8Array): number | null {
  if (bytes.length < WAV_HEADER_BYTES) return null
  const header = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!)
  if (header !== "RIFF") return null

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const byteRate = view.getUint32(28, true)
  if (!byteRate) return null

  return (bytes.length - WAV_HEADER_BYTES) / byteRate
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
