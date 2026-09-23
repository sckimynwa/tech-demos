import { AlertCircleIcon, Loader2Icon } from 'lucide-react'
import type { UseMutationResult } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ExtractRequest, ExtractResponse } from '../types'
import { LinkList } from './LinkList'
import { LlmExtractionNotice } from './LlmExtractionNotice'

type ExtractResultPanelProps = {
  mutation: UseMutationResult<ExtractResponse, Error, ExtractRequest>
}

export function ExtractResultPanel({ mutation }: ExtractResultPanelProps) {
  if (mutation.isPending) return <ExtractLoading url={mutation.variables.url} />
  if (mutation.isError) return <ExtractError message={mutation.error.message} />
  if (mutation.isSuccess) return <ExtractSuccess result={mutation.data} />
  return <p className="text-muted-foreground text-sm">Enter a public URL and hit Run.</p>
}

function ExtractLoading({ url }: { url: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2Icon className="size-4 animate-spin" />
      Launching local Chrome and loading {url}…
    </div>
  )
}

function ExtractError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>Run failed</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

const preClassName = 'bg-muted max-h-96 overflow-auto rounded-md p-3 text-xs whitespace-pre-wrap'

function ExtractSuccess({ result }: { result: ExtractResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{result.title || '(untitled page)'}</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <span className="truncate">{result.url}</span>
          <Badge variant="secondary">{result.durationMs} ms</Badge>
          <Badge variant="secondary">{result.links.length} links</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {result.llm && <LlmExtractionNotice llm={result.llm} />}
        <Tabs defaultValue="text">
          <TabsList>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="links">Links ({result.links.length})</TabsTrigger>
            <TabsTrigger value="a11y">Accessibility tree</TabsTrigger>
          </TabsList>
          <TabsContent value="text">
            <pre className={preClassName}>{result.text || '(no visible text)'}</pre>
            {result.textTruncated && <p className="text-muted-foreground mt-1 text-xs">Text truncated.</p>}
          </TabsContent>
          <TabsContent value="links">
            <LinkList links={result.links} />
          </TabsContent>
          <TabsContent value="a11y">
            <pre className={preClassName}>{result.accessibilityTree}</pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
