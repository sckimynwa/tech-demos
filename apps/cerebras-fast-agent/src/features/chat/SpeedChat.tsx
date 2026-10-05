import { useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CHAT_STARTERS } from "@/shared/constants";
import { TokMeter } from "./TokMeter";
import { useChatStream } from "./useChatStream";

export function SpeedChat() {
  const { messages, meter, busy, error, model, send } = useChatStream();
  const [draft, setDraft] = useState("");

  const submit = () => {
    const next = draft;
    setDraft("");
    void send(next);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="min-h-[520px] border-0 bg-card/60">
        <CardContent className="flex h-full min-h-[520px] flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] tracking-[0.14em] text-amber-200/70 uppercase">
                speed chat
              </p>
              <h2 className="font-heading text-xl">OpenAI-compatible stream</h2>
            </div>
            {model ? (
              <Badge variant="outline" className="font-mono">
                {model}
              </Badge>
            ) : null}
          </div>

          <ScrollArea className="h-[340px] rounded-xl bg-background/40 ring-1 ring-white/5">
            <div className="space-y-3 p-4">
              {messages.length === 0 ? (
                <EmptyChat onPick={(prompt) => void send(prompt)} />
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "ml-8 rounded-2xl bg-amber-400/10 px-3 py-2 text-sm"
                        : "mr-8 rounded-2xl bg-white/5 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                    }
                  >
                    <p className="mb-1 font-mono text-[10px] tracking-wider text-amber-200/60 uppercase">
                      {message.role}
                    </p>
                    {message.content || (
                      <span className="text-muted-foreground">waiting for first token…</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
              placeholder="Ask why fast decode matters in an agent loop…"
              rows={2}
              className="min-h-12 flex-1 resize-none rounded-xl border-input bg-background/70 px-3 py-2 text-sm ring-1 ring-white/10 outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
            />
            <Button type="submit" disabled={busy || !draft.trim()} className="self-end">
              <ArrowUp data-icon="inline-start" />
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <TokMeter meter={meter} busy={busy} />
    </div>
  );
}

function EmptyChat({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="space-y-4 py-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="size-4 text-amber-300" />
        <p className="text-sm">No thread yet. Hit a starter or type your own.</p>
      </div>
      <div className="flex flex-col gap-2">
        {CHAT_STARTERS.map((starter) => (
          <button
            key={starter}
            type="button"
            onClick={() => onPick(starter)}
            className="rounded-xl bg-white/4 px-3 py-2 text-left text-sm text-amber-50/90 ring-1 ring-white/8 transition hover:bg-amber-400/10 hover:ring-amber-400/30"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
}
