import { TEAMS } from "../domain/roster";
import type { AgentRuntime } from "../domain/types";
import { STATUS_COLOR } from "../office/constants";

type AgentPanelProps = {
  agent: AgentRuntime | null;
  onClose: () => void;
};

const formatTime = (at: number) =>
  new Date(at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const AgentPanel = ({ agent, onClose }: AgentPanelProps) => {
  if (!agent) return null;
  const team = TEAMS[agent.team];
  return (
    <aside className="panel" data-testid="agent-panel">
      <header className="panel__head">
        <div>
          <p className="panel__kicker" style={{ color: team.color }}>
            {team.label} · {agent.role}
          </p>
          <h2>{agent.name}</h2>
        </div>
        <button type="button" className="ghost" onClick={onClose}>
          Close
        </button>
      </header>
      <div className="panel__status">
        <span
          className="dot"
          style={{ background: STATUS_COLOR[agent.state] }}
        />
        <strong>{agent.state}</strong>
        <span className="muted">@ {agent.place}</span>
      </div>
      <p className="panel__task">{agent.task}</p>
      <h3>Recent task log</h3>
      <ol className="log">
        {agent.log.map((entry) => (
          <li key={`${entry.at}-${entry.task}`}>
            <time>{formatTime(entry.at)}</time>
            <b style={{ color: STATUS_COLOR[entry.state] }}>{entry.state}</b>
            <span>{entry.task}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
};
