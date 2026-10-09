import { LabHeader } from "@/domains/lab/components/LabHeader";
import { ComparisonPanes } from "@/domains/lab/components/ComparisonPanes";
import { LoopControls } from "@/domains/lab/components/LoopControls";
import { LoopEvolution } from "@/domains/lab/components/LoopEvolution";
import { MetricsRow } from "@/domains/lab/components/MetricsRow";
import { SweepChart } from "@/domains/lab/components/SweepChart";
import { useLabState } from "@/domains/lab/hooks/useLabState";

export default function App() {
  const lab = useLabState();

  return (
    <div className="min-h-svh bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        <LabHeader />
        <LoopControls
          task={lab.task}
          onTask={lab.setTask}
          loops={lab.loops}
          onLoops={lab.setLoops}
          presetId={lab.presetId}
          onPreset={lab.applyPreset}
          a={lab.a}
          b={lab.b}
          onOperand={lab.setOperand}
          onRandom={lab.randomize}
          mazeId={lab.mazeId}
          onMaze={lab.setMazeId}
        />
        <MetricsRow looped={lab.loopedMetrics} plain={lab.baselineMetrics} />
        <ComparisonPanes
          task={lab.task}
          loopedAddition={lab.additionTrace}
          plainAddition={lab.plainAddition}
          loopedMaze={lab.mazeTrace}
          plainMaze={lab.plainMaze}
        />
        <LoopEvolution task={lab.task} addition={lab.additionTrace} maze={lab.mazeTrace} />
        <SweepChart points={lab.sweep} activeLoops={lab.loops} />
      </main>
    </div>
  );
}
