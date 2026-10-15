import { ContactShadows, OrbitControls } from "@react-three/drei";
import {
  DESKS,
  occupantsAt,
  resolveDestination,
  TEAM_PODS,
} from "../domain/locations";
import type { AgentRuntime } from "../domain/types";
import { AgentFigure } from "./AgentFigure";
import {
  Desk,
  MeetingTable,
  OfficeShell,
  Plant,
  ReviewBay,
  TeamRug,
  Whiteboard,
} from "./Furniture";

type SceneProps = {
  agents: Record<string, AgentRuntime>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export const Scene = ({ agents, selectedId, onSelect }: SceneProps) => {
  const meetingIds = occupantsAt(agents, "meeting");
  const reviewIds = occupantsAt(agents, "review");

  return (
    <>
      <color attach="background" args={["#1a1410"]} />
      <fog attach="fog" args={["#1a1410", 22, 48]} />
      <ambientLight intensity={0.32} />
      <hemisphereLight args={["#ffe8c8", "#3d2a1c", 0.55]} />
      <directionalLight
        castShadow
        position={[9, 16, 7]}
        intensity={1.35}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <pointLight position={[-6, 3.4, 5]} intensity={8} color="#fbbf24" distance={10} />
      <pointLight position={[6, 3.4, 5]} intensity={8} color="#c4b5fd" distance={10} />
      <pointLight position={[0, 3.2, -6]} intensity={10} color="#a78bfa" distance={12} />
      <OfficeShell />
      {(Object.keys(TEAM_PODS) as Array<keyof typeof TEAM_PODS>).map((team) => (
        <TeamRug key={team} team={team} {...TEAM_PODS[team]} />
      ))}
      {Object.entries(DESKS).map(([id, desk]) => (
        <Desk
          key={`desk-${id}`}
          x={desk.x}
          z={desk.z}
          facing={desk.facing}
          glow={agents[id]?.state === "working"}
        />
      ))}
      <MeetingTable />
      <ReviewBay />
      <Whiteboard />
      <Plant x={-10.4} z={7.6} />
      <Plant x={10.4} z={7.6} />
      <Plant x={-10.4} z={-7.6} />
      <Plant x={10.4} z={-7.8} />
      <Plant x={-2.8} z={1.8} />
      {Object.values(agents).map((agent) => {
        const occupants = agent.place === "desk" ? [agent.id] : agent.place === "meeting" ? meetingIds : reviewIds;
        return (
          <AgentFigure
            key={agent.id}
            agent={agent}
            destination={resolveDestination(agent.id, agent.place, occupants)}
            selected={selectedId === agent.id}
            onSelect={onSelect}
          />
        );
      })}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={28}
        blur={1.8}
        far={8}
      />
      <OrbitControls
        makeDefault
        target={[0, 0.4, 0]}
        maxPolarAngle={Math.PI / 2.12}
        minDistance={8}
        maxDistance={30}
        enableDamping
      />
    </>
  );
};
