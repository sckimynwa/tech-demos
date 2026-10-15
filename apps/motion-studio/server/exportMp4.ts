import { spawn } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function encodeMp4(frames: Buffer[], fps: number): Promise<Buffer> {
  const dir = join(tmpdir(), `motion-studio-${Date.now()}-${Math.random().toString(16).slice(2)}`)
  await mkdir(dir, { recursive: true })
  try {
    await Promise.all(
      frames.map((frame, index) =>
        writeFile(join(dir, `frame_${String(index).padStart(4, '0')}.jpg`), frame),
      ),
    )
    const out = join(dir, 'out.mp4')
    await runFfmpeg([
      '-y',
      '-framerate',
      String(fps),
      '-i',
      join(dir, 'frame_%04d.jpg'),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '18',
      '-movflags',
      '+faststart',
      out,
    ])
    return await readFile(out)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => {
      reject(new Error(`ffmpeg missing or failed to start: ${error.message}`))
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(stderr.slice(-1200) || `ffmpeg exited ${code}`))
    })
  })
}
