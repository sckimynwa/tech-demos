import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"
import { useState } from "react"

const ACCEPT = "audio/*,.wav,.mp3,.m4a,.ogg,.flac,.webm,.aac,.mp4"

type UploadDropzoneProps = {
  fileName: string | null
  onFile: (file: File) => void
}

export function UploadDropzone({ fileName, onFile }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-center transition-colors",
        isDragging && "border-amber-300/60 bg-amber-300/5",
      )}
    >
      <Upload className="size-5 text-amber-200" />
      <div className="text-sm">
        <span className="font-medium">Drop an audio file</span>
        <span className="text-muted-foreground"> or click to browse</span>
      </div>
      <p className="text-xs text-muted-foreground">wav · mp3 · m4a · ogg · flac · webm · up to 25 MB</p>
      {fileName ? <p className="font-mono text-xs text-amber-100">{fileName}</p> : null}
      <Input
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
        }}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={() => setIsDragging(false)}
      />
    </label>
  )
}
