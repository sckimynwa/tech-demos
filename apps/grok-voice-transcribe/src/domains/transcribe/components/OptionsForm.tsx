import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LANGUAGE_OPTIONS } from "../constants"
import type { TranscribeOptions } from "../types"

const AUTO_LANGUAGE = "auto"

type OptionsFormProps = {
  options: TranscribeOptions
  keytermInput: string
  onOptionsChange: (next: TranscribeOptions) => void
  onKeytermInputChange: (value: string) => void
}

export function OptionsForm({
  options,
  keytermInput,
  onOptionsChange,
  onKeytermInputChange,
}: OptionsFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ToggleRow
        id="diarize"
        label="Speaker labels"
        hint="diarize=true"
        checked={options.diarize}
        onCheckedChange={(diarize) => onOptionsChange({ ...options, diarize })}
      />
      <ToggleRow
        id="format"
        label="Written numbers"
        hint="format / ITN"
        checked={options.format}
        onCheckedChange={(format) => onOptionsChange({ ...options, format })}
      />
      <ToggleRow
        id="fillers"
        label="Keep fillers"
        hint="um / uh"
        checked={options.fillerWords}
        onCheckedChange={(fillerWords) => onOptionsChange({ ...options, fillerWords })}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="language">Language</Label>
        <Select
          value={options.language || AUTO_LANGUAGE}
          onValueChange={(value) =>
            onOptionsChange({ ...options, language: value === AUTO_LANGUAGE ? "" : value })
          }
        >
          <SelectTrigger id="language" className="w-full">
            <SelectValue placeholder="Auto-detect" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value || AUTO_LANGUAGE} value={option.value || AUTO_LANGUAGE}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="keyterms">Key terms</Label>
        <Input
          id="keyterms"
          placeholder="SpaceXAI, Grok Voice Transcribe"
          value={keytermInput}
          onChange={(event) => onKeytermInputChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">Comma-separated bias terms forwarded as repeated keyterm fields.</p>
      </div>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2">
      <div className="flex flex-col">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
