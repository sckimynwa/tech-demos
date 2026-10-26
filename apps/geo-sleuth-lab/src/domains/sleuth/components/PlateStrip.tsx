import { Upload } from "lucide-react"
import { SAMPLE_PLATES } from "@/domains/sleuth/samples"
import type { SampleId } from "@/domains/sleuth/types"
import type { Selection } from "@/domains/sleuth/use-sleuth-run"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PlateStripProps = {
  selection: Selection
  disabled: boolean
  onSelectSample: (sampleId: SampleId) => void
  onSelectUpload: (file: File) => void
}

export function PlateStrip({ selection, disabled, onSelectSample, onSelectUpload }: PlateStripProps) {
  const uploadSelected = selection.kind === "upload"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">Plates</h2>
        <p className="text-xs text-muted-foreground">Synthetic public landmarks, or your own image</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SAMPLE_PLATES.map((plate) => {
          const selected = selection.kind === "sample" && selection.sampleId === plate.id
          return (
            <button
              key={plate.id}
              type="button"
              data-testid={`plate-${plate.id}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onSelectSample(plate.id)}
              className={`overflow-hidden rounded-xl text-left ring-1 ring-foreground/10 transition disabled:opacity-60 ${
                selected ? "ring-2 ring-orange-700" : "hover:ring-foreground/30"
              }`}
            >
              <img src={plate.plateSrc} alt={plate.title} className="aspect-[16/10] w-full object-cover" />
              <span className="block px-2 py-1.5">
                <span className="block truncate text-xs font-medium">{plate.title}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{plate.place}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label
          className={cn(
            buttonVariants({ variant: "outline" }),
            "cursor-pointer",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload />
          Upload an image
          <input
            data-testid="upload-input"
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ""
              if (file) onSelectUpload(file)
            }}
          />
        </label>
        {uploadSelected ? (
          <Badge variant="outline" data-testid="upload-name">
            {selection.fileName}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Uploads get the refusal path. No invented fix.</span>
        )}
        {uploadSelected ? (
          <img
            src={selection.previewUrl}
            alt={`Uploaded file ${selection.fileName}`}
            className="ml-auto h-12 w-20 rounded-md object-cover ring-1 ring-foreground/10"
          />
        ) : null}
      </div>
    </div>
  )
}
