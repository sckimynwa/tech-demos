import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2Icon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QuestionBuilder } from "@/features/editor/QuestionBuilder";
import { StateEditor } from "@/features/editor/StateEditor";
import { cloneDefaults } from "@/features/editor/presets";
import { MetaStrip } from "@/features/results/MetaStrip";
import { ResultCard } from "@/features/results/ResultCard";
import { WirePanel } from "@/features/results/WirePanel";
import { COLD_START_HINT_MS, fetchConfig, runSystemOne, type RunFailure, type RunSuccess } from "@/lib/api";
import { buildRequest, initialDraft, saveDraft } from "@/lib/draft";
import {
  DEFAULT_MODEL,
  DEFAULT_THRESHOLD,
  type ApiConfig,
  type SystemOneRequest,
} from "@/shared/systemone";

export default function App() {
  const boot = useMemo(() => initialDraft(), []);
  const [state, setState] = useState(boot.state);
  const [model, setModel] = useState(boot.model);
  const [questions, setQuestions] = useState(boot.questions);
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [coldHint, setColdHint] = useState(false);
  const [success, setSuccess] = useState<RunSuccess | null>(null);
  const [failure, setFailure] = useState<RunFailure | null>(null);
  const [lastRequest, setLastRequest] = useState<SystemOneRequest | null>(null);
  const runGen = useRef(0);

  useEffect(() => {
    saveDraft({ state, model, questions });
  }, [state, model, questions]);

  useEffect(() => {
    let cancelled = false;
    fetchConfig()
      .then((next) => {
        if (cancelled) return;
        setConfig(next);
        setConfigError(null);
        setModel((current) => (current === DEFAULT_MODEL ? next.model : current));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setConfigError(error instanceof Error ? error.message : "config failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = useCallback(async () => {
    const request = buildRequest(state, model, questions);
    const gen = ++runGen.current;
    setPending(true);
    setColdHint(false);
    setFailure(null);
    setLastRequest(request);
    const hint = window.setTimeout(() => {
      if (runGen.current === gen) setColdHint(true);
    }, COLD_START_HINT_MS);
    const result = await runSystemOne(request);
    window.clearTimeout(hint);
    if (runGen.current !== gen) return;
    setPending(false);
    setColdHint(false);
    if (result.ok) {
      setSuccess(result);
      setFailure(null);
    } else {
      setFailure(result);
    }
  }, [state, model, questions]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        void run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [run]);

  const mode: "mock" | "live" = success?.mode ?? config?.mode ?? "mock";
  const isMock = mode === "mock";

  return (
    <TooltipProvider>
      <div className="min-h-svh bg-background">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">Kev</p>
              <h1 className="text-lg font-medium">System One ticket-routing playground</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isMock ? "secondary" : "default"}>{isMock ? "Mock" : "Live"}</Badge>
              {config?.baseUrlHost ? (
                <span className="font-mono text-xs text-muted-foreground">{config.baseUrlHost}</span>
              ) : null}
              <div className="flex items-center gap-1.5">
                <Label htmlFor="model" className="text-xs text-muted-foreground">
                  Model
                </Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className="h-8 w-44 font-mono text-xs"
                  placeholder={DEFAULT_MODEL}
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" onClick={() => void run()} disabled={pending}>
                    {pending ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <PlayIcon data-icon="inline-start" />}
                    Run
                  </Button>
                </TooltipTrigger>
                <TooltipContent>⌘/Ctrl+Enter</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {isMock ? (
            <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100">
              Mock — set KEV_BASE_URL for real Kev
            </div>
          ) : null}
        </header>

        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
          <section className="space-y-5">
            <StateEditor state={state} onChange={setState} />
            <QuestionBuilder questions={questions} onChange={setQuestions} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuestions(cloneDefaults());
                setModel(config?.model ?? DEFAULT_MODEL);
              }}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Reset questions
            </Button>
          </section>

          <section className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="threshold">Escalation threshold</Label>
                <span className="font-mono text-xs">{threshold.toFixed(2)}</span>
              </div>
              <Slider
                id="threshold"
                min={0}
                max={100}
                step={1}
                value={[Math.round(threshold * 100)]}
                onValueChange={(value) => setThreshold((value[0] ?? 80) / 100)}
              />
              <p className="text-xs text-muted-foreground">
                noul ≥ threshold → send to human, otherwise route automatically.
              </p>
            </div>

            {configError ? (
              <ErrorBox title="API unreachable" body="The Bun server is not responding. Is bun run dev still up?" />
            ) : null}

            {pending ? (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-card/50 p-3 text-sm">
                <Loader2Icon className="mt-0.5 size-4 animate-spin" />
                <div>
                  <p>Running System One…</p>
                  {coldHint ? (
                    <p className="text-muted-foreground">
                      Modal endpoints can take ~35s to wake from scale-to-zero. Still waiting.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {failure ? <FailureBox failure={failure} /> : null}

            {success ? (
              <div className="space-y-3">
                <MetaStrip
                  mode={success.mode}
                  response={success.response}
                  clientMs={success.clientMs}
                  requestId={success.requestId}
                />
                {Object.entries(success.response.answers).map(([id, answer]) => (
                  <ResultCard key={id} id={id} answer={answer} threshold={threshold} />
                ))}
              </div>
            ) : !pending && !failure ? (
              <p className="text-sm text-muted-foreground">
                Edit a ticket and questions, then Run. Mock mode answers in the exact /v1/systemone wire shape.
              </p>
            ) : null}

            <WirePanel request={lastRequest} response={success?.response ?? null} />
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}

function FailureBox({ failure }: { failure: RunFailure }) {
  const title =
    failure.kind === "unauthorized"
      ? "401 — bad API key"
      : failure.kind === "validation"
        ? "422 — validation"
        : failure.kind === "unreachable"
          ? "Unreachable server"
          : `HTTP ${failure.status ?? ""}`;
  return <ErrorBox title={title} body={failure.message} />;
}

function ErrorBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
      <p className="font-medium text-destructive">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-destructive/90">{body}</p>
    </div>
  );
}
