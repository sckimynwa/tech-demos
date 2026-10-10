import { Canvas } from "@react-three/fiber";
import type { AgentRuntime } from "../domain/types";
import { Scene } from "./Scene";

type OfficeCanvasProps = {
  agents: Record<string, AgentRuntime>;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export const OfficeCanvas = ({
  agents,
  selectedId,
  onSelect,
}: OfficeCanvasProps) => (
  <Canvas
    shadows
    camera={{ position: [15, 13, 15], fov: 38, near: 0.1, far: 80 }}
    onPointerMissed={() => onSelect("")}
  >
    <Scene agents={agents} selectedId={selectedId} onSelect={onSelect} />
  </Canvas>
);
