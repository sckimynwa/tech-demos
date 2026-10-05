import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { TICKET_PRESETS } from "@/features/editor/presets";

type StateEditorProps = {
  state: string;
  onChange: (state: string) => void;
};

export function StateEditor({ state, onChange }: StateEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TICKET_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant={state === preset.state ? "default" : "outline"}
            onClick={() => onChange(preset.state)}
            title={preset.blurb}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ticket-state">Ticket state</Label>
        <Textarea
          id="ticket-state"
          value={state}
          onChange={(event) => onChange(event.target.value)}
          rows={6}
          className="font-mono text-[13px] leading-relaxed"
          placeholder="Paste a support ticket…"
        />
      </div>
    </div>
  );
}
