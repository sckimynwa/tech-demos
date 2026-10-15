import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Languages, Timer, Users } from "lucide-react"
import type { UseMutationResult } from "@tanstack/react-query"
import type { SttResult, TranscribeOptions } from "../types"
import { formatSeconds, speakerLabel } from "../lib/format"
import { SPEAKER_COLORS } from "../constants"
import { cn } from "@/lib/utils"

type TranscriptResultProps = {
  mutation: UseMutationResult<SttResult, Error, { file: File; options: TranscribeOptions }>
}

export function TranscriptResult({ mutation }: TranscriptResultProps) {
  if (mutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcribing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Sending audio through the Bun proxy…</p>
        </CardContent>
      </Card>
    )
  }

  if (mutation.isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Transcription failed</AlertTitle>
        <AlertDescription>{mutation.error.message}</AlertDescription>
      </Alert>
    )
  }

  if (!mutation.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Record, upload, or load the sample clip, then hit Transcribe.
          </p>
        </CardContent>
      </Card>
    )
  }

  const result = mutation.data
  const speakers = new Set(result.words.map((word) => word.speaker).filter((value) => value !== undefined))

  return (
    <Card data-testid="transcript-result">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Transcript</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">
              <Languages data-icon="inline-start" />
              {result.language}
            </Badge>
            <Badge variant="outline">
              <Timer data-icon="inline-start" />
              {formatSeconds(result.duration)}
            </Badge>
            {speakers.size > 0 ? (
              <Badge variant="outline">
                <Users data-icon="inline-start" />
                {speakers.size} speakers
              </Badge>
            ) : null}
            <Badge variant={result.mode === "live" ? "default" : "secondary"}>{result.mode}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-base leading-relaxed">{result.text}</p>
        <Tabs defaultValue="speakers">
          <TabsList>
            <TabsTrigger value="speakers">Speakers</TabsTrigger>
            <TabsTrigger value="words">Words</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="speakers" className="pt-3">
            <SpeakerTurns words={result.words} />
          </TabsContent>
          <TabsContent value="words" className="pt-3">
            <WordTimeline words={result.words} />
          </TabsContent>
          <TabsContent value="json" className="pt-3">
            <pre className="max-h-80 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SpeakerTurns({ words }: { words: SttResult["words"] }) {
  const turns: Array<{ speaker?: number; text: string }> = []
  for (const word of words) {
    const last = turns.at(-1)
    if (!last || last.speaker !== word.speaker) {
      turns.push({ speaker: word.speaker, text: word.text })
    } else {
      last.text += ` ${word.text}`
    }
  }

  if (turns.length === 0) {
    return <p className="text-muted-foreground text-sm">No words returned.</p>
  }

  return (
    <ol className="flex flex-col gap-3">
      {turns.map((turn, index) => (
        <li key={`${turn.speaker}-${index}`} className="flex flex-col gap-1">
          <span
            className={cn(
              "w-fit rounded-full px-2 py-0.5 text-xs ring-1",
              SPEAKER_COLORS[(turn.speaker ?? 0) % SPEAKER_COLORS.length],
            )}
          >
            {speakerLabel(turn.speaker)}
          </span>
          <p>{turn.text}</p>
        </li>
      ))}
    </ol>
  )
}

function WordTimeline({ words }: { words: SttResult["words"] }) {
  if (words.length === 0) {
    return <p className="text-muted-foreground text-sm">No word timestamps returned.</p>
  }

  return (
    <div className="flex flex-wrap gap-1.5" data-testid="word-timeline">
      {words.map((word, index) => (
        <span
          key={`${word.start}-${word.text}-${index}`}
          title={`${formatSeconds(word.start)}–${formatSeconds(word.end)}${
            word.speaker !== undefined ? ` · ${speakerLabel(word.speaker)}` : ""
          }`}
          className={cn(
            "rounded-md px-1.5 py-1 font-mono text-xs ring-1",
            word.speaker === undefined
              ? "bg-white/5 text-foreground ring-white/10"
              : SPEAKER_COLORS[word.speaker % SPEAKER_COLORS.length],
          )}
        >
          {word.text}
          <span className="ml-1 text-[10px] opacity-70">{word.start.toFixed(2)}</span>
        </span>
      ))}
    </div>
  )
}
