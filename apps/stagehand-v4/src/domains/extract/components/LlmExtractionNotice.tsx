import { AlertCircleIcon, InfoIcon, SparklesIcon } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { LlmExtraction } from '../types'

export function LlmExtractionNotice({ llm }: { llm: LlmExtraction }) {
  switch (llm.status) {
    case 'ok':
      return (
        <Alert>
          <SparklesIcon />
          <AlertTitle>stagehand.extract() · {llm.model}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">{llm.extraction}</AlertDescription>
        </Alert>
      )
    case 'skipped':
      return (
        <Alert>
          <InfoIcon />
          <AlertTitle>Instruction skipped: no LLM configured</AlertTitle>
          <AlertDescription>{llm.reason}</AlertDescription>
        </Alert>
      )
    case 'error':
      return (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>stagehand.extract() failed · {llm.model}</AlertTitle>
          <AlertDescription>{llm.message}</AlertDescription>
        </Alert>
      )
  }
}
