import { TEAMS } from "../domain/roster";
import type { AgentRuntime, OfficeEvent } from "../domain/types";
import { STATUS_COLOR } from "../office/constants";

type HudProps = {
  agents: Record<string, AgentRuntime>;
  feed: OfficeEvent[];
  paused: boolean;
  onTogglePause: () => void;
  onSelect: (id: string) => void;
};

export const Hud = ({
  agents,
  feed,
  paused,
  onTogglePause,
  onSelect,
}: HudProps) => {
  const latest = feed[0];
  const latestAgent = latest ? agents[latest.agentId] : undefined;
  return (
    <div className="hud">
      <header className="hud__brand">
        <p className="hud__kicker">Hermes3D-inspired · mock stream</p>
        <h1>1HQ Office</h1>
        <p className="muted">
          Orbit to look around. Click an agent for its task log.
        </p>
        <button type="button" className="ghost" onClick={onTogglePause}>
          {paused ? "Resume stream" : "Pause stream"}
        </button>
      </header>
      <ul className="legend">
        {Object.values(TEAMS).map((team) => (
          <li key={team.id}>
            <span className="swatch" style={{ background: team.color }} />
            {team.label}
          </li>
        ))}
      </ul>
      {latest && latestAgent ? (
        <p className="ticker" data-testid="event-ticker">
          <span
            className="dot"
            style={{ background: STATUS_COLOR[latest.state] }}
          />
          <button
            type="button"
            className="link"
            onClick={() => onSelect(latest.agentId)}
          >
            {latestAgent.name}
          </button>
          <span className="muted">→ {latest.state}</span>
          <span>{latest.task}</span>
        </p>
      ) : null}
    </div>
  );
};
