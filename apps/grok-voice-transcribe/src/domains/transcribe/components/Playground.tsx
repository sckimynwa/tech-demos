import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AudioLines, Sparkles } from "lucide-react"
import { useState } from "react"
import { SAMPLE_CLIP_NAME, SAMPLE_CLIP_PATH } from "../constants"
import { useTranscribeMutation } from "../hooks/useTranscribeMutation"
import type { TranscribeOptions } from "../types"
import { OptionsForm } from "./OptionsForm"
import { RecorderControls } from "./RecorderControls"
import { TranscriptResult } from "./TranscriptResult"
import { UploadDropzone } from "./UploadDropzone"

const INITIAL_OPTIONS: TranscribeOptions = {
  diarize: true,
  format: true,
  fillerWords: false,
  language: "",
  keyterms: [],
}

function parseKeyterms(value: string) {
  return value
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean)
}

export function Playground() {
  const mutation = useTranscribeMutation()
  const [sourceTab, setSourceTab] = useState("upload")
  const [file, setFile] = useState<File | null>(null)
  const [options, setOptions] = useState<TranscribeOptions>(INITIAL_OPTIONS)
  const [keytermInput, setKeytermInput] = useState("SpaceXAI, Grok Voice Transcribe")

  const runTranscribe = (nextFile: File) => {
    mutation.mutate({
      file: nextFile,
      options: { ...options, keyterms: parseKeyterms(keytermInput) },
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Audio</CardTitle>
            <CardDescription>Mic capture, local file, or the bundled sample clip.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Tabs value={sourceTab} onValueChange={setSourceTab}>
              <TabsList>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="mic">Microphone</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="pt-4">
                <UploadDropzone
                  fileName={file && sourceTab === "upload" ? file.name : null}
                  onFile={setFile}
                />
              </TabsContent>
              <TabsContent value="mic" className="pt-4">
                <RecorderControls
                  onBlob={(blob, fileName) => {
                    if (!blob) {
                      setFile(null)
                      return
                    }
                    setFile(new File([blob], fileName, { type: blob.type || "audio/webm" }))
                  }}
                />
              </TabsContent>
            </Tabs>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!file || mutation.isPending}
                onClick={() => {
                  if (file) runTranscribe(file)
                }}
              >
                <AudioLines />
                Transcribe
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  void loadSampleClip()
                    .then((sample) => {
                      setSourceTab("upload")
                      setFile(sample)
                      runTranscribe(sample)
                    })
                    .catch((error: unknown) => {
                      mutation.reset()
                      window.alert(error instanceof Error ? error.message : "Failed to load sample clip")
                    })
                }}
              >
                <Sparkles />
                Try sample clip
              </Button>
            </div>
            {file ? (
              <p className="font-mono text-xs text-muted-foreground">
                Ready: {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>STT options</CardTitle>
            <CardDescription>Forwarded to POST /v1/stt as multipart fields.</CardDescription>
          </CardHeader>
          <CardContent>
            <OptionsForm
              options={options}
              keytermInput={keytermInput}
              onOptionsChange={setOptions}
              onKeytermInputChange={setKeytermInput}
            />
          </CardContent>
        </Card>
      </div>

      <TranscriptResult mutation={mutation} />
    </div>
  )
}

async function loadSampleClip() {
  const response = await fetch(SAMPLE_CLIP_PATH)
  if (!response.ok) throw new Error("Sample clip missing")
  const blob = await response.blob()
  return new File([blob], SAMPLE_CLIP_NAME, { type: blob.type || "audio/wav" })
}
