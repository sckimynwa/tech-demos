import type { LocalStatus as LocalStatusValue } from "@/domains/voice/types";
import { cn } from "@/lib/utils";

type LocalStatusProps = {
  status: LocalStatusValue | null;
};

function Dot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "size-1.5 rounded-full",
        ok ? "bg-[#3dcf8e]" : "bg-[#ef5d5d]",
      )}
    />
  );
}

export function LocalStatus({ status }: LocalStatusProps) {
  if (!status) {
    return (
      <p className="text-xs text-white/40" data-testid="local-status">
        Checking Moonshine and Ollama…
      </p>
    );
  }

  const sttOk = status.stt.ready;
  const llmOk = status.ollama.reachable && status.ollama.modelPresent;

  return (
    <div
      data-testid="local-status"
      className="flex max-w-xl flex-col gap-1 text-left text-[11px] leading-4 text-white/55"
    >
      <p className="flex items-center gap-2">
        <Dot ok={sttOk} />
        <span>
          STT {sttOk ? "ready" : "missing"} — {status.stt.detail}
        </span>
      </p>
      <p className="flex items-center gap-2">
        <Dot ok={status.ollama.reachable} />
        <span>
          Ollama {status.ollama.reachable ? "reachable" : "down"} —{" "}
          {status.ollama.detail}
        </span>
      </p>
      <p className="flex items-center gap-2">
        <Dot ok={llmOk} />
        <span>
          Model {llmOk ? "present" : "absent"} — {status.ollama.model}
        </span>
      </p>
      <p className="text-white/35">
        Moonshine Korean Tiny does not stream. VAD cuts the utterance, then STT
        runs. Empty STT is never invented.
      </p>
    </div>
  );
}
