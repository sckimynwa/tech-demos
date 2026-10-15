import { Badge } from "@/components/ui/badge";
import type { Health } from "@/lib/types";

export function HeaderBar({ health }: { health: Health | null }) {
  const mode = health?.mode ?? "mock";

  return (
    <header className="flex items-start justify-between gap-4 border-b border-border/80 px-5 py-4 md:px-8">
      <div className="flex items-start gap-3">
        <SparkMark />
        <div>
          <h1 className="font-serif text-[1.65rem] leading-none tracking-tight">
            Muse Spark
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Streaming agent playground · Meta Model API
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Badge
          className={
            mode === "live"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-primary/40 bg-primary/10 text-primary"
          }
        >
          {mode}
        </Badge>
        <Badge className="normal-case tracking-normal text-muted-foreground">
          {health?.model ?? "muse-spark"}
        </Badge>
      </div>
    </header>
  );
}

function SparkMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="mt-0.5 size-9 shrink-0"
      aria-hidden="true"
    >
      <path
        d="M16 2.5 18.8 13.2 29.5 16 18.8 18.8 16 29.5 13.2 18.8 2.5 16 13.2 13.2Z"
        fill="#f0a43a"
      />
    </svg>
  );
}
