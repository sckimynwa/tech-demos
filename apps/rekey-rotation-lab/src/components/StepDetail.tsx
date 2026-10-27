import { targetById } from "@/domain/fixture.ts";
import type { LabStep, World } from "@/domain/types.ts";
import {
  CodeBlock,
  CodeBlockContent,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block.tsx";
import { Secret } from "./Secret.tsx";

export function StepDetail({ step, world }: { step: LabStep | null; world: World }) {
  if (!step) {
    return (
      <p className="text-sm text-muted-foreground">
        Rotate to issue a fake key and walk every template. Diffs stay masked.
      </p>
    );
  }
  const runtime = step.diff ? world.targets[step.diff.targetId] : null;
  const spec = step.diff ? targetById(step.diff.targetId) : null;
  return (
    <div className="grid gap-3" data-testid="step-detail">
      <div>
        <h3 className="font-medium">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.detail}</p>
      </div>
      {step.diff && spec && runtime ? (
        <CodeBlock size="sm" variant={step.tone === "error" ? "destructive" : "default"}>
          <CodeBlockHeader>
            <CodeBlockTitle>
              {spec.variable} · {spec.title}
            </CodeBlockTitle>
          </CodeBlockHeader>
          <CodeBlockContent>
            <CodeBlockLine variant="removed">
              stored <Secret value={step.diff.before} />
            </CodeBlockLine>
            <CodeBlockLine variant="added">
              stored <Secret value={step.diff.after} />
            </CodeBlockLine>
            <CodeBlockLine variant="highlighted">
              running <Secret value={runtime.loaded} />
            </CodeBlockLine>
            {step.diff.plainUnchanged.map((line) => (
              <CodeBlockLine key={line.key}>
                {line.key}={line.value} unchanged
              </CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      ) : null}
      {step.snapshot ? (
        <ul className="grid gap-1 text-xs">
          {step.snapshot.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="w-24 text-muted-foreground">{row.id}</span>
              <span>{row.phase}</span>
              <span>
                stored <Secret value={row.stored} />
              </span>
              <span>
                running <Secret value={row.loaded} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {step.log.length > 0 ? (
        <CodeBlock size="sm">
          <CodeBlockHeader>
            <CodeBlockTitle>rekey</CodeBlockTitle>
          </CodeBlockHeader>
          <CodeBlockContent wrap>
            {step.log.map((line, index) => (
              <CodeBlockLine key={`${step.id}-${index}`}>{line}</CodeBlockLine>
            ))}
          </CodeBlockContent>
        </CodeBlock>
      ) : null}
    </div>
  );
}
