import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FormEvent } from "react";

export const SUGGESTED_PROMPTS = [
  "What time is it in Seoul?",
  "What's the weather in Tokyo — do I need an umbrella?",
  "Seoul weather and local time. Should I go for a walk?",
];

export function Composer({
  value,
  onChange,
  onSubmit,
  onSuggest,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSuggest: (prompt: string) => void;
  disabled: boolean;
}) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="border-t border-border/80 bg-background/80 px-5 py-4 backdrop-blur md:px-8">
      <div className="mb-3 flex flex-wrap gap-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSuggest(prompt)}
            className="rounded-full border border-border bg-card px-3 py-1 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Ask Muse Spark — time, weather, or the Model API"
          disabled={disabled}
          autoFocus
        />
        <Button type="submit" disabled={disabled || value.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
