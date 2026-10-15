import { Button } from "@/components/ui/button"
import { Mic, Square, Trash2 } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useRecorder } from "../hooks/useRecorder"
import { formatClock } from "../lib/format"
import { Waveform } from "./Waveform"

type RecorderControlsProps = {
  onBlob: (blob: Blob | null, fileName: string) => void
}

function fileNameForBlob(blob: Blob) {
  if (blob.type.includes("mp4")) return "mic-recording.m4a"
  return "mic-recording.webm"
}

export function RecorderControls({ onBlob }: RecorderControlsProps) {
  const recorder = useRecorder()
  const previewUrl = useMemo(() => (recorder.blob ? URL.createObjectURL(recorder.blob) : null), [recorder.blob])

  useEffect(() => {
    if (recorder.state === "recorded" && recorder.blob) {
      onBlob(recorder.blob, fileNameForBlob(recorder.blob))
    }
  }, [onBlob, recorder.blob, recorder.state])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div className="flex flex-col gap-3">
      <Waveform levels={recorder.levels} active={recorder.state === "recording"} />
      <div className="flex flex-wrap items-center gap-2">
        {recorder.state !== "recording" ? (
          <Button
            type="button"
            onClick={() => {
              void recorder.start()
            }}
          >
            <Mic />
            Record
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              recorder.stop()
            }}
          >
            <Square />
            Stop
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          disabled={recorder.state === "idle"}
          onClick={() => {
            recorder.reset()
            onBlob(null, "")
          }}
        >
          <Trash2 />
          Reset
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {formatClock(recorder.elapsedMs)}
          {recorder.state === "recorded" ? " · captured" : ""}
        </span>
      </div>
      {recorder.error ? (
        <p className="text-sm text-destructive" role="alert">
          {recorder.error}. Use file upload or the sample clip instead.
        </p>
      ) : null}
      {previewUrl ? <audio controls src={previewUrl} className="w-full" /> : null}
    </div>
  )
}
