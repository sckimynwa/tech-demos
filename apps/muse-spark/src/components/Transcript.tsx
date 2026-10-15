import { ToolTraceCard } from "@/components/ToolTraceCard";
import type { ChatTurn } from "@/lib/types";

export function Transcript({
  turns,
  streaming,
}: {
  turns: ChatTurn[];
  streaming: boolean;
}) {
  return (
    <div className="flex flex-col gap-5">
      {turns.map((turn) =>
        turn.kind === "user" ? (
          <UserBubble key={turn.id} text={turn.text} />
        ) : (
          <AssistantBlock key={turn.id} turn={turn} />
        ),
      )}
      {streaming ? (
        <p className="font-mono text-[11px] tracking-[0.18em] text-primary/80 uppercase">
          streaming
        </p>
      ) : null}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[42rem]">
      <p className="mb-1 text-right font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        you
      </p>
      <div className="rounded-lg border border-border bg-accent px-4 py-3 text-[15px] leading-6">
        {text}
      </div>
    </div>
  );
}

function AssistantBlock({
  turn,
}: {
  turn: Extract<ChatTurn, { kind: "assistant" }>;
}) {
  return (
    <div className="max-w-[46rem]">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-primary">
        spark
      </p>
      {turn.traces.length > 0 ? (
        <div className="mb-3 flex flex-col gap-2">
          {turn.traces.map((trace) => (
            <ToolTraceCard key={trace.id} trace={trace} />
          ))}
        </div>
      ) : null}
      {turn.text ? (
        <p className="whitespace-pre-wrap text-[15px] leading-7 text-foreground/95">
          {turn.text}
        </p>
      ) : null}
    </div>
  );
}
