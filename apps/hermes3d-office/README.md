# Hermes3D Office (1HQ)

Single-user retro 3D office demo. Thirteen example-org agents sit by team and
walk between desks, the standup table, and the review bay as a **mock event
stream** updates their state.

Inspired by [Hermes3D](https://github.com/iamlukethedev/Hermes3D) (MIT). This
folder is a faithful *minimal* reimplementation — see
`THIRD_PARTY_NOTICES.md` for reused vs rewritten.

## Run

```bash
cd apps/hermes3d-office
bun install
bun run dev
```

Open `http://localhost:5173`. No API keys.

- Orbit / zoom the office
- Click an agent for its recent mock task log
- Pause the mock stream from the HUD

## Roster (display names)

| Team | Agents |
| --- | --- |
| 1HQ Product | Hailey, Sol, Wade, tachi |
| Growth | Lucy, Connor, Paul |
| AX | Leo, June, Ahrin |
| Global | Yuna |
| Corp | Evan, ellie |

States: `idle` → desk, `working` → desk (monitor glow), `reviewing` → review
bay, `done` → meeting table.

## Event hook (optional, mock default)

Default driver is an in-browser ticker (`EVENT_TICK_MS = 2400`). To pipe real
agent events later, use either hook — both accept the same JSON shape:

```json
{
  "type": "agent.state",
  "agentId": "hailey",
  "state": "reviewing",
  "task": "Review PR #88",
  "at": 1770000000000
}
```

`agentId` is the lowercase roster id (`hailey`, `tachi`, `ellie`, …).
`state` is `idle | working | reviewing | done`.

### Browser console

```js
window.Hermes3DOffice.ingest({
  type: "agent.state",
  agentId: "hailey",
  state: "reviewing",
  task: "Review PR #88",
  at: Date.now(),
});
```

### WebSocket

Open the app with `?events=ws://127.0.0.1:8787`. Each frame should be one
JSON object in the shape above. There is no server in this demo; the mock
ticker still runs unless you pause it.
