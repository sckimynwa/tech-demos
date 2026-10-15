import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProbBar } from "@/features/results/ProbBar";
import type { Answer } from "@/shared/systemone";

type ResultCardProps = {
  id: string;
  answer: Answer;
  threshold: number;
};

export function ResultCard({ id, answer, threshold }: ResultCardProps) {
  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="font-mono text-sm">{id}</CardTitle>
        <AnswerMeta answer={answer} threshold={threshold} />
      </CardHeader>
      <CardContent className="space-y-3">
        {answer.type === "noul" ? <NoulBody answer={answer} threshold={threshold} /> : null}
        {answer.type === "choice" ? <ChoiceBody answer={answer} /> : null}
        {answer.type === "score" ? <ScoreBody answer={answer} /> : null}
      </CardContent>
    </Card>
  );
}

function AnswerMeta({ answer, threshold }: { answer: Answer; threshold: number }) {
  if (answer.type === "noul") {
    const sendToHuman = answer.noul >= threshold;
    return (
      <Badge variant={sendToHuman ? "destructive" : "secondary"}>
        {sendToHuman ? "send to human" : "route automatically"}
      </Badge>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {answer.type === "choice" ? <Badge variant="outline">{answer.choice}</Badge> : null}
      {answer.type === "score" ? (
        <Badge variant="outline">score {answer.score.toFixed(2)}</Badge>
      ) : null}
      <Badge variant="secondary">confidence {answer.confidence.toFixed(2)}</Badge>
    </div>
  );
}

function NoulBody({ answer, threshold }: { answer: Extract<Answer, { type: "noul" }>; threshold: number }) {
  return (
    <div className="space-y-2">
      <ProbBar label={`p(yes)  ·  threshold ${threshold.toFixed(2)}`} value={answer.noul} highlight />
    </div>
  );
}

function ChoiceBody({ answer }: { answer: Extract<Answer, { type: "choice" }> }) {
  return (
    <div className="space-y-2">
      {Object.entries(answer.probabilities).map(([name, value]) => (
        <ProbBar key={name} label={name} value={value} highlight={name === answer.choice} />
      ))}
    </div>
  );
}

function ScoreBody({ answer }: { answer: Extract<Answer, { type: "score" }> }) {
  const levelCount = Object.keys(answer.legend).length;
  const maxIndex = Math.max(1, levelCount - 1);
  const markerPct = Math.max(0, Math.min(1, answer.score / maxIndex)) * 100;
  return (
    <div className="space-y-3">
      {Object.entries(answer.legend).map(([key, label]) => (
        <ProbBar
          key={key}
          label={`${key} · ${label}`}
          value={answer.probabilities[key] ?? 0}
          highlight={key === String(Math.round(answer.score))}
        />
      ))}
      <div className="relative h-8 pt-4">
        <div className="absolute inset-x-0 top-5 h-px bg-border" />
        <div
          className="absolute top-4 h-3 w-0.5 bg-primary"
          style={{ left: `calc(${markerPct}% - 1px)` }}
        />
        <span
          className="absolute top-0 -translate-x-1/2 font-mono text-[10px] text-muted-foreground"
          style={{ left: `${markerPct}%` }}
        >
          E[level]={answer.score.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
