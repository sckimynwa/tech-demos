import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const SAMPLE_RATE = 16_000
const DURATION_SEC = 8
const AMPLITUDE = 0.18

function writeSampleWav(targetPath: string) {
  const sampleCount = SAMPLE_RATE * DURATION_SEC
  const dataSize = sampleCount * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write("RIFF", 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write("WAVE", 8)
  buffer.write("fmt ", 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(SAMPLE_RATE, 24)
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write("data", 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let index = 0; index < sampleCount; index += 1) {
    const t = index / SAMPLE_RATE
    const freq = t < 4 ? 220 : 330
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin(Math.PI * t * 2))
    const sample = Math.round(Math.sin(2 * Math.PI * freq * t) * envelope * AMPLITUDE * 32767)
    buffer.writeInt16LE(sample, 44 + index * 2)
  }

  mkdirSync(dirname(targetPath), { recursive: true })
  writeFileSync(targetPath, buffer)
}

writeSampleWav(join(import.meta.dir, "..", "public", "sample-meeting.wav"))
console.log("wrote public/sample-meeting.wav")
