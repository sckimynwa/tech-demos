import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { VoiceMode } from "@/domains/voice/types";
import { SAMPLE_UTTERANCES, SAMPLE_UTTERANCES_KO } from "@/lib/constants";

type SpeakBarProps = {
  disabled: boolean;
  mode: VoiceMode;
  onSubmit: (text: string) => void;
};

export function SpeakBar({ disabled, mode, onSubmit }: SpeakBarProps) {
  const samples = mode === "local" ? SAMPLE_UTTERANCES_KO : SAMPLE_UTTERANCES;
  const [draft, setDraft] = useState("");

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onSubmit(trimmed);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(draft);
  };

  return (
    <div className="border-t border-white/8 bg-[#120f14]/90 px-4 py-4 backdrop-blur">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-4xl flex-col gap-3"
      >
        <div className="flex flex-wrap gap-2">
          {samples.map((sample) => (
            <Button
              key={sample.label}
              variant="chip"
              size="sm"
              data-testid={`chip-${sample.label.toLowerCase().replace(/\s+/g, "-")}`}
              disabled={disabled}
              onClick={() => submit(sample.text)}
            >
              {sample.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            data-testid="speak-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled}
            placeholder={
              disabled
                ? "Start the call to speak or type a task"
                : "Type as if you were speaking — the call stays up"
            }
            className="h-11 flex-1 rounded-full border border-white/10 bg-[#1b161d] px-4 text-sm text-[#f6e6d8] placeholder:text-white/30 focus:border-[#f4b183]/50 focus:outline-none"
          />
          <Button
            type="submit"
            data-testid="speak-send"
            disabled={disabled || !draft.trim()}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
