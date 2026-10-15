import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = {
  disabled?: boolean
  onFiles: (files: File[]) => void
  collect: (dt: DataTransfer) => Promise<File[]>
}

export function DropZone({ disabled, onFiles, collect }: Props) {
  const [hot, setHot] = useState(false)

  return (
    <Card
      size="sm"
      className={cn(
        "border-dashed",
        hot && "ring-2 ring-ring",
        disabled && "opacity-50",
      )}
    >
      <CardContent>
        <label
          className="flex cursor-pointer flex-col items-center gap-2 py-4 text-center"
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setHot(true)
          }}
          onDragLeave={() => setHot(false)}
          onDrop={(e) => {
            e.preventDefault()
            setHot(false)
            if (disabled) return
            void collect(e.dataTransfer).then(onFiles)
          }}
        >
          <span className="text-sm font-medium">Drop a folder or files</span>
          <span className="text-xs text-muted-foreground">
            images, .txt/.md, code, short audio
          </span>
          <input
            type="file"
            className="sr-only"
            multiple
            disabled={disabled}
            accept=".txt,.md,.ts,.tsx,.js,.jsx,.py,.json,image/*,audio/*,.wav,.mp3,.m4a"
            onChange={(e) => {
              const list = e.target.files
              if (list) onFiles(Array.from(list))
              e.target.value = ""
            }}
          />
        </label>
      </CardContent>
    </Card>
  )
}
