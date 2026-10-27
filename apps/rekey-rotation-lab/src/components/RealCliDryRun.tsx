import { useState } from "react";
import { Button } from "@/components/ui/button.tsx";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block.tsx";

interface DryRunBody {
  ok?: boolean;
  error?: string;
  stdout?: string;
  stderr?: string;
  code?: number;
}

export function RealCliDryRun() {
  const [output, setOutput] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function runDryRun() {
    setPending(true);
    setOutput("");
    try {
      const response = await fetch("/api/rekey-dry-run", { method: "POST" });
      const body = (await response.json()) as DryRunBody;
      const text = [body.error, body.stdout, body.stderr].filter(Boolean).join("\n");
      setOutput(text || `HTTP ${response.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "request failed";
      setOutput(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10" data-testid="real-cli">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium">Real rekey CLI, dry-run only</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Off unless the dev server was started with <span className="font-mono">REKEY_REAL=1</span>.
            The request always runs <span className="font-mono">rekey --no-input rotate shop.openai --dry-run</span> against a temp file store. It does not issue keys or write Vercel, Supabase, or GitHub.
          </p>
        </div>
        <Button type="button" variant="outline" disabled={pending} onClick={() => void runDryRun()} data-testid="real-cli-run">
          {pending ? "Running…" : "Run dry-run"}
        </Button>
      </div>
      {output ? (
        <CodeBlock size="sm">
          <CodeBlockHeader>
            <CodeBlockTitle>stdout</CodeBlockTitle>
          </CodeBlockHeader>
          <CodeBlockContent wrap>
            {output.split("\n").map((line, index) => (
              <CodeBlockLine key={index}>{line}</CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      ) : null}
    </section>
  );
}
