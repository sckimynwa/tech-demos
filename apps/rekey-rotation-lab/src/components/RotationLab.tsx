import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { usePlanPlayer } from "@/hooks/usePlanPlayer.ts";
import { DependencyGraph } from "./DependencyGraph.tsx";
import { RealCliDryRun } from "./RealCliDryRun.tsx";
import { StepTimeline } from "./StepTimeline.tsx";

export function RotationLab() {
  const player = usePlanPlayer();

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">rekey rotate shop.openai</p>
          <h1 className="text-2xl font-medium tracking-tight">Rotation lab</h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            One fake OpenAI key, four template targets, the same order as golbin/rekey. Masked values only.
          </p>
        </div>
        <Badge variant="outline">fully mocked</Badge>
      </header>

      <p
        data-testid="lab-status"
        className="rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-foreground/10"
      >
        {player.status}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={player.rotate} data-testid="rotate">
          Rotate
        </Button>
        <Button type="button" variant="outline" onClick={player.undo} disabled={!player.undoEnabled} data-testid="undo">
          Undo
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={player.playing ? player.pause : player.resume}
          disabled={!player.playing && !player.canResume}
          data-testid="pause"
        >
          {player.playing ? "Pause" : "Resume"}
        </Button>
        <Button type="button" variant="ghost" onClick={player.reset} data-testid="reset">
          Reset
        </Button>
        <label className="ms-auto flex items-center gap-2 text-sm">
          <Switch
            checked={player.failDeploy}
            onCheckedChange={player.setFailDeploy}
            disabled={player.playing}
            data-testid="fail-deploy"
          />
          Fail the forward Vercel redeploy
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Where shop.openai is used</CardTitle>
            <CardDescription>
              Highlight follows the step. Vercel production is the only target that redeploys. Stored and running diverge until that deploy is healthy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DependencyGraph world={player.world} focus={player.active?.focus ?? null} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Per-target diff, redeploy log, then result. Revoke stays manual.</CardDescription>
          </CardHeader>
          <CardContent>
            <StepTimeline
              steps={player.steps}
              cursor={player.cursor}
              playing={player.playing}
              world={player.world}
              onSelect={player.select}
            />
          </CardContent>
        </Card>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch checked={player.realCli} onCheckedChange={player.setRealCli} data-testid="real-cli-toggle" />
        Opt into the real CLI dry-run (stays off by default)
      </label>
      {player.realCli ? <RealCliDryRun /> : null}

      <footer className="text-xs text-muted-foreground">
        Modeled on{" "}
        <a className="underline" href="https://github.com/golbin/rekey">
          golbin/rekey
        </a>{" "}
        (MIT). Source note:{" "}
        <a className="underline" href="https://x.com/golbin/status/2113142211718287795">
          the original post
        </a>
        .
      </footer>
    </main>
  );
}
