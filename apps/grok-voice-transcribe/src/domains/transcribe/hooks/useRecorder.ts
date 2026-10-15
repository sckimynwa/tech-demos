import { useCallback, useRef, useState } from "react"
import { RECORDER_TIMESLICE_MS, WAVEFORM_BAR_COUNT } from "../constants"

export type RecorderState = "idle" | "recording" | "recorded"

function pickMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? ""
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle")
  const [blob, setBlob] = useState<Blob | null>(null)
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.08))
  const [error, setError] = useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const startedAtRef = useRef(0)
  const tickRef = useRef<number>(0)

  const stopTracks = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    window.clearInterval(tickRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    analyserRef.current = null
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setBlob(null)
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const context = new AudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      const buffer = new Uint8Array(analyser.frequencyBinCount)
      const pulse = () => {
        analyser.getByteFrequencyData(buffer)
        const bars = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
          const sample = buffer[index % buffer.length] ?? 0
          return Math.max(0.08, sample / 255)
        })
        setLevels(bars)
        rafRef.current = requestAnimationFrame(pulse)
      }
      rafRef.current = requestAnimationFrame(pulse)

      const recorder = new MediaRecorder(stream, { mimeType: pickMimeType() })
      mediaRecorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm"
        const recorded = new Blob(chunksRef.current, { type: mimeType })
        setBlob(recorded)
        setState("recorded")
        void context.close()
        stopTracks()
      }

      startedAtRef.current = Date.now()
      setElapsedMs(0)
      tickRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current)
      }, 200)

      recorder.start(RECORDER_TIMESLICE_MS)
      setState("recording")
    } catch (cause) {
      stopTracks()
      setState("idle")
      setError(cause instanceof Error ? cause.message : "Microphone permission denied")
    }
  }, [stopTracks])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    stopTracks()
    setBlob(null)
    setState("idle")
    setElapsedMs(0)
    setLevels(Array.from({ length: WAVEFORM_BAR_COUNT }, () => 0.08))
  }, [stopTracks])

  return { state, blob, levels, error, elapsedMs, start, stop, reset }
}
