import { GitCompareArrows, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BOOKING_SCENARIO } from "@/shared/constants";
import { ConfirmationCard } from "./ConfirmationCard";
import { Timeline, TimelineLegend } from "./Timeline";
import { useBookingRun } from "./useBookingRun";

export function BookingPlayground() {
  const sequential = useBookingRun("sequential");
  const parallel = useBookingRun("parallel");
  const racing =
    sequential.run.status === "running" || parallel.run.status === "running";

  const axisMs = Math.max(
    sequential.run.totalMs ?? sequential.run.nowMs,
    parallel.run.totalMs ?? parallel.run.nowMs,
    1,
  );

  const savedMs =
    sequential.run.totalMs !== null && parallel.run.totalMs !== null
      ? sequential.run.totalMs - parallel.run.totalMs
      : null;

  const race = async () => {
    sequential.reset();
    parallel.reset();
    await Promise.all([
      sequential.start(BOOKING_SCENARIO),
      parallel.start(BOOKING_SCENARIO),
    ]);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-card/60">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="font-mono text-[11px] tracking-[0.2em] text-amber-200/70 uppercase">
              restaurant booking race
            </p>
            <h2 className="font-heading text-xl">Sequential vs parallel tool calls</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Same Saturday-for-4 SoMa Italian brief. Sequential pays an LLM+API tax per
              lookup. Parallel fans out availability and menus, then books. Tools are
              mocked with real-ish latencies so the Gantt stays honest without OpenTable.
            </p>
            <p className="rounded-lg bg-background/50 px-3 py-2 font-mono text-xs text-amber-100/80">
              {BOOKING_SCENARIO}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={racing}
              onClick={() => void sequential.start(BOOKING_SCENARIO)}
            >
              Sequential
            </Button>
            <Button
              variant="outline"
              disabled={racing}
              onClick={() => void parallel.start(BOOKING_SCENARIO)}
            >
              Parallel
            </Button>
            <Button disabled={racing} onClick={() => void race()}>
              <GitCompareArrows data-icon="inline-start" />
              Race both
            </Button>
          </div>
        </CardContent>
      </Card>

      {savedMs !== null ? (
        <div className="flex items-center gap-2 rounded-xl bg-amber-400/10 px-4 py-3 text-sm ring-1 ring-amber-400/20">
          <Play className="size-4 text-amber-300" />
          Parallel finished{" "}
          <span className="font-mono text-amber-200">
            {(savedMs / 1000).toFixed(2)}s
          </span>{" "}
          faster on this run.
        </div>
      ) : null}

      <TimelineLegend />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-0 bg-card/60">
          <CardContent>
            <Timeline run={sequential.run} axisMs={axisMs} />
          </CardContent>
        </Card>
        <Card className="border-0 bg-card/60">
          <CardContent>
            <Timeline run={parallel.run} axisMs={axisMs} />
          </CardContent>
        </Card>
      </div>

      {parallel.run.booked || sequential.run.booked ? (
        <ConfirmationCard booked={(parallel.run.booked ?? sequential.run.booked)!} />
      ) : null}
    </div>
  );
}
