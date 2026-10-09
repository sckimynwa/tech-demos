import { useCallback, useState } from 'react'
import {
  compileOffline,
  defaultPrompt,
  defaultScene,
  type CompileResult,
} from '../lib/compileOffline.ts'
import { captureJpegFrames, downloadBlob, packFrames } from '../lib/exportFrames.ts'
import { normalizeScene, type Scene } from '../lib/scene.ts'
import { usePlayer } from './usePlayer.ts'

export function useStudio() {
  const [prompt, setPrompt] = useState(defaultPrompt)
  const [scene, setScene] = useState<Scene>(defaultScene)
  const [source, setSource] = useState<CompileResult['source']>('sample')
  const [model, setModel] = useState<string | undefined>()
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const player = usePlayer(scene.duration)

  const applyCompile = useCallback(
    (result: CompileResult) => {
      const next = normalizeScene(result.scene)
      setScene(next)
      setSource(result.source)
      setModel(result.model)
      player.setT(0)
      player.setPlaying(true)
    },
    [player],
  )

  const generate = useCallback(async () => {
    setCompiling(true)
    setCompileError(null)
    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (response.ok) {
        const data = (await response.json()) as {
          scene: unknown
          source: CompileResult['source']
          model?: string
        }
        if (data.scene) {
          applyCompile({
            scene: normalizeScene(data.scene),
            source: data.source,
            model: data.model,
          })
          return
        }
      }
      applyCompile(compileOffline(prompt))
    } catch {
      applyCompile(compileOffline(prompt))
    } finally {
      setCompiling(false)
    }
  }, [applyCompile, prompt])

  const loadSample = useCallback(
    (nextPrompt: string, sampleId?: string) => {
      setPrompt(nextPrompt)
      const result = compileOffline(nextPrompt, sampleId)
      applyCompile(result)
    },
    [applyCompile],
  )

  const exportMp4 = useCallback(async () => {
    setExporting(true)
    setExportError(null)
    setExportProgress('Rendering frames…')
    player.setPlaying(false)
    try {
      const frames = await captureJpegFrames(scene, (index, total) => {
        setExportProgress(`Rendering ${index} / ${total}`)
      })
      setExportProgress('Encoding H.264…')
      const packed = packFrames(frames)
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Fps': String(scene.fps),
        },
        body: packed,
      })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Export failed (${response.status})`)
      }
      const blob = await response.blob()
      downloadBlob(blob, `${scene.id}.mp4`)
      setExportProgress('Downloaded MP4')
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
      setExportProgress(null)
    } finally {
      setExporting(false)
    }
  }, [player, scene])

  return {
    prompt,
    setPrompt,
    scene,
    source,
    model,
    compiling,
    compileError,
    generate,
    loadSample,
    exporting,
    exportProgress,
    exportError,
    exportMp4,
    player,
  }
}
