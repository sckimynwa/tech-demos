import { ExtractForm } from '@/domains/extract/components/ExtractForm'
import { ExtractResultPanel } from '@/domains/extract/components/ExtractResultPanel'
import { ModelStatusBadge } from '@/domains/extract/components/ModelStatusBadge'
import { useExtractMutation } from '@/domains/extract/hooks/useExtractMutation'

export default function App() {
  const extractMutation = useExtractMutation()

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Stagehand v4 extract playground</h1>
          <ModelStatusBadge />
        </div>
        <p className="text-muted-foreground text-sm">
          Runs <code>@browserbasehq/stagehand</code> v4 against one public URL in a local headless Chrome, then
          returns page text, links, and Stagehand's accessibility snapshot.
        </p>
      </header>
      <ExtractForm isRunning={extractMutation.isPending} onRun={(request) => extractMutation.mutate(request)} />
      <ExtractResultPanel mutation={extractMutation} />
    </main>
  )
}
