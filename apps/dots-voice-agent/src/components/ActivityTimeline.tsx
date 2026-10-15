import { FileText, ListTodo, Search, Sparkles } from "lucide-react";
import type { AgentTask, TimelineEvent } from "@/domains/queue/types";
import { cn, formatClock } from "@/lib/utils";

type ActivityTimelineProps = {
  events: TimelineEvent[];
  tasks: AgentTask[];
};

function taskIcon(kind: AgentTask["kind"]) {
  if (kind === "summary") {
    return ListTodo;
  }
  if (kind === "file_write") {
    return FileText;
  }
  return Search;
}

export function ActivityTimeline({ events, tasks }: ActivityTimelineProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-white/8 bg-[#161218]/80 lg:w-[380px] lg:border-l">
      <header className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#f4b183]">
            Activity
          </p>
          <h2 className="text-base text-[#f6e6d8]">Background queue</h2>
        </div>
        <Sparkles className="size-4 text-[#f4b183]/70" />
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-6">
        <section>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">
            Tasks
          </p>
          {tasks.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-sm text-white/40">
              Nothing queued yet. Start the call and speak a task.
            </p>
          ) : (
            <ol data-testid="task-list" className="space-y-2">
              {tasks.map((task) => {
                const Icon = taskIcon(task.kind);
                return (
                  <li
                    key={task.id}
                    className="rounded-2xl border border-white/8 bg-white/4 px-3 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 place-items-center rounded-full bg-[#2a2228] text-[#f4b183]">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-[#f6e6d8]">
                            {task.kind.replace("_", " ")}
                          </p>
                          <StatusBadge status={task.status} />
                        </div>
                        <p className="truncate text-xs text-white/45">{task.query}</p>
                        {task.filePath ? (
                          <p className="mt-1 font-mono text-[11px] text-[#7dffc0]">
                            {task.filePath}
                          </p>
                        ) : null}
                        {task.result && task.status === "done" ? (
                          <p className="mt-2 line-clamp-4 text-xs leading-5 text-white/60">
                            {task.result}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section>
          <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/35">
            Timeline
          </p>
          <ol className="relative space-y-3 border-l border-white/10 pl-4">
            {events.length === 0 ? (
              <li className="text-sm text-white/40">Call events land here.</li>
            ) : (
              events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-[#f4b183]" />
                  <p className="text-[11px] text-white/35">{formatClock(event.at)}</p>
                  <p className="text-sm text-[#f6e6d8]">{event.title}</p>
                  {event.detail ? (
                    <p className="line-clamp-3 text-xs leading-5 text-white/50">
                      {event.detail}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ol>
        </section>
      </div>
    </aside>
  );
}

function StatusBadge({ status }: { status: AgentTask["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
        status === "queued" && "bg-white/8 text-white/60",
        status === "running" && "bg-[#f4b183]/15 text-[#f4b183]",
        status === "done" && "bg-[#3dcf8e]/15 text-[#7dffc0]",
        status === "error" && "bg-[#ef5d5d]/15 text-[#ff8d8d]",
      )}
    >
      {status}
    </span>
  );
}
