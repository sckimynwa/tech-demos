import { useState, type FormEvent } from 'react'
import { Loader2Icon, PlayIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ExtractRequest } from '../types'

const DEFAULT_URL = 'https://example.com'

type ExtractFormProps = {
  isRunning: boolean
  onRun: (request: ExtractRequest) => void
}

export function ExtractForm({ isRunning, onRun }: ExtractFormProps) {
  const [url, setUrl] = useState(DEFAULT_URL)
  const [instruction, setInstruction] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onRun({ url, instruction })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="instruction">
          Extract instruction <span className="text-muted-foreground font-normal">(optional, needs a model key)</span>
        </Label>
        <Textarea
          id="instruction"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
          placeholder="e.g. summarize what this page is for in one sentence"
          rows={2}
        />
      </div>
      <Button type="submit" disabled={isRunning} className="self-start">
        {isRunning ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
        {isRunning ? 'Running…' : 'Run'}
      </Button>
    </form>
  )
}
