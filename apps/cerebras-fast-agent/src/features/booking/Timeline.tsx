import type { BookingRunState, TimelineSpan } from "./useBookingRun";

const TOOL_COLORS: Record<string, string> = {
  search_restaurants: "bg-sky-400",
  check_availability: "bg-amber-400",
  get_menu_highlights: "bg-violet-400",
  book_table: "bg-emerald-400",
  llm: "bg-zinc-400",
};

function spanColor(span: TimelineSpan): string {
  return TOOL_COLORS[span.name] ?? "bg-amber-300";
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

export function Timeline({
  run,
  axisMs,
}: {
  run: BookingRunState;
  axisMs: number;
}) {
  const widthMs = Math.max(axisMs, run.nowMs, 1);
  const showTicks = widthMs >= 400;
  const ticks = showTicks
    ? [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(widthMs * fraction))
    : [];

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.18em] text-amber-200/70 uppercase">
            {run.strategy}
          </p>
          <p className="text-sm text-muted-foreground">
            {run.status === "idle"
              ? "waiting"
              : run.status === "running"
                ? "in flight"
                : run.status === "error"
                  ? "failed"
                  : `${run.toolCount} tools`}
          </p>
        </div>
        <p className="font-mono text-2xl text-amber-200 tabular-nums">
          {formatMs(run.totalMs ?? run.nowMs)}
        </p>
      </div>

      {showTicks ? (
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
          {ticks.map((tick) => (
            <span key={tick}>{formatMs(tick)}</span>
          ))}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {run.spans.length === 0 ? (
          <div className="rounded-lg bg-white/4 px-3 py-6 text-center text-sm text-muted-foreground ring-1 ring-white/5">
            Timeline empty — run this lane.
          </div>
        ) : (
          run.spans.map((span) => {
            const end = span.endMs ?? run.nowMs;
            const left = (span.startMs / widthMs) * 100;
            const width = Math.max(1.6, ((end - span.startMs) / widthMs) * 100);
            return (
              <div key={span.id} className="grid grid-cols-[168px_minmax(0,1fr)] items-center gap-2">
                <p className="truncate font-mono text-[11px] text-muted-foreground" title={span.detail ?? span.label}>
                  {span.label}
                </p>
                <div className="relative h-6 rounded-md bg-white/4 ring-1 ring-white/5">
                  <div
                    className={`absolute top-1 h-4 rounded-sm ${spanColor(span)} ${
                      span.endMs === null ? "animate-pulse" : ""
                    }`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {run.transcript ? (
        <p className="rounded-lg bg-background/50 px-3 py-2 text-sm leading-relaxed text-amber-50/90">
          {run.transcript}
        </p>
      ) : null}
      {run.error ? <p className="text-sm text-destructive">{run.error}</p> : null}
    </div>
  );
}

export function TimelineLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
      {Object.entries({
        llm: "LLM think",
        search_restaurants: "search",
        check_availability: "availability",
        get_menu_highlights: "menu",
        book_table: "book",
      }).map(([key, label]) => (
        <span key={key} className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-sm ${TOOL_COLORS[key]}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
