import { PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type DraftQuestion, emptyQuestion } from "@/features/editor/presets";
import type { QuestionType } from "@/shared/systemone";

type QuestionBuilderProps = {
  questions: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
};

function updateAt(questions: DraftQuestion[], uid: string, patch: Partial<DraftQuestion>): DraftQuestion[] {
  return questions.map((q) => (q.uid === uid ? { ...q, ...patch } : q));
}

export function QuestionBuilder({ questions, onChange }: QuestionBuilderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Questions</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange([...questions, emptyQuestion(questions.length + 1)])}
        >
          <PlusIcon data-icon="inline-start" />
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.uid}
            question={question}
            index={index}
            onChange={(patch) => onChange(updateAt(questions, question.uid, patch))}
            onRemove={() => onChange(questions.filter((q) => q.uid !== question.uid))}
            canRemove={questions.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

type QuestionCardProps = {
  question: DraftQuestion;
  index: number;
  onChange: (patch: Partial<DraftQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

function QuestionCard({ question, index, onChange, onRemove, canRemove }: QuestionCardProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">#{index + 1}</Badge>
        <Input
          value={question.id}
          onChange={(event) => onChange({ id: event.target.value })}
          className="h-7 w-36 font-mono text-xs"
          aria-label="Question id"
        />
        <Select
          value={question.type}
          onValueChange={(value) => onChange({ type: value as QuestionType })}
        >
          <SelectTrigger size="sm" className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="noul">noul</SelectItem>
            <SelectItem value="choice">choice</SelectItem>
            <SelectItem value="score">score</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Remove question"
        >
          <Trash2Icon />
        </Button>
      </div>
      <Textarea
        value={question.instructions}
        onChange={(event) => onChange({ instructions: event.target.value })}
        rows={2}
        placeholder="Instructions the model sees"
      />
      {question.type === "noul" ? <NoulCriteria question={question} onChange={onChange} /> : null}
      {question.type === "choice" ? <ChoiceCriteria question={question} onChange={onChange} /> : null}
      {question.type === "score" ? <ScoreCriteria question={question} onChange={onChange} /> : null}
    </div>
  );
}

function NoulCriteria({
  question,
  onChange,
}: {
  question: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">true (optional)</Label>
        <Input
          value={question.noulTrue}
          onChange={(event) => onChange({ noulTrue: event.target.value })}
          placeholder="What yes means"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">false (optional)</Label>
        <Input
          value={question.noulFalse}
          onChange={(event) => onChange({ noulFalse: event.target.value })}
          placeholder="What no means"
        />
      </div>
    </div>
  );
}

function ChoiceCriteria({
  question,
  onChange,
}: {
  question: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
}) {
  const options = question.choiceOptions;
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Options (name → description)</Label>
      {options.map((option, index) => (
        <div key={`${question.uid}-opt-${index}`} className="flex gap-2">
          <Input
            value={option.name}
            onChange={(event) => {
              const next = options.map((row, i) => (i === index ? { ...row, name: event.target.value } : row));
              onChange({ choiceOptions: next });
            }}
            className="w-32 font-mono"
            placeholder="name"
          />
          <Input
            value={option.description}
            onChange={(event) => {
              const next = options.map((row, i) =>
                i === index ? { ...row, description: event.target.value } : row,
              );
              onChange({ choiceOptions: next });
            }}
            placeholder="description or empty → null"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={options.length <= 1}
            onClick={() => onChange({ choiceOptions: options.filter((_, i) => i !== index) })}
            aria-label="Remove option"
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange({ choiceOptions: [...options, { name: "", description: "" }] })}
      >
        <PlusIcon data-icon="inline-start" />
        Option
      </Button>
    </div>
  );
}

function ScoreCriteria({
  question,
  onChange,
}: {
  question: DraftQuestion;
  onChange: (patch: Partial<DraftQuestion>) => void;
}) {
  const levels = question.scoreLevels;
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Levels, low → high</Label>
      {levels.map((level, index) => (
        <div key={`${question.uid}-lvl-${index}`} className="flex items-center gap-2">
          <span className="w-5 font-mono text-xs text-muted-foreground">{index}</span>
          <Input
            value={level}
            onChange={(event) => {
              const next = levels.map((row, i) => (i === index ? event.target.value : row));
              onChange({ scoreLevels: next });
            }}
            placeholder={`level ${index}`}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={levels.length <= 1}
            onClick={() => onChange({ scoreLevels: levels.filter((_, i) => i !== index) })}
            aria-label="Remove level"
          >
            <Trash2Icon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange({ scoreLevels: [...levels, ""] })}
      >
        <PlusIcon data-icon="inline-start" />
        Level
      </Button>
    </div>
  );
}
