import { useCallback, useEffect, useState } from "react";
import { applyOfficeEvent } from "./domain/events";
import { useOfficeIngest } from "./domain/ingest";
import { EVENT_TICK_MS, nextMockEvent } from "./domain/mockStream";
import { seedAgents } from "./domain/roster";
import type { OfficeEvent } from "./domain/types";
import { OfficeCanvas } from "./office/OfficeCanvas";
import { AgentPanel } from "./ui/AgentPanel";
import { Hud } from "./ui/Hud";

export const App = () => {
  const [agents, setAgents] = useState(seedAgents);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feed, setFeed] = useState<OfficeEvent[]>([]);
  const [paused, setPaused] = useState(false);

  const onEvent = useCallback((event: OfficeEvent) => {
    setAgents((current) => applyOfficeEvent(current, event));
    setFeed((current) => [event, ...current].slice(0, 24));
  }, []);

  useOfficeIngest(onEvent);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setAgents((current) => {
        const event = nextMockEvent(current);
        setFeed((feedNow) => [event, ...feedNow].slice(0, 24));
        return applyOfficeEvent(current, event);
      });
    }, EVENT_TICK_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const selected = selectedId ? (agents[selectedId] ?? null) : null;

  return (
    <div className="app">
      <OfficeCanvas
        agents={agents}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id || null)}
      />
      <Hud
        agents={agents}
        feed={feed}
        paused={paused}
        onTogglePause={() => setPaused((value) => !value)}
        onSelect={setSelectedId}
      />
      <AgentPanel agent={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
};

export default App;
