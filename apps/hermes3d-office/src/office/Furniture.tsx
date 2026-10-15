import { Text } from "@react-three/drei";
import { TEAMS } from "../domain/roster";
import type { TeamId } from "../domain/types";
import { FLOOR, PLASTER, TRIM, WOOD, WOOD_DARK } from "./constants";

type DeskProps = {
  x: number;
  z: number;
  facing?: number;
  glow?: boolean;
};

export const Desk = ({ x, z, facing = 0, glow = false }: DeskProps) => (
  <group position={[x, 0, z]} rotation={[0, facing, 0]}>
    <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.55, 0.08, 0.82]} />
      <meshStandardMaterial color={WOOD} roughness={0.55} />
    </mesh>
    {(
      [
        [-0.68, 0.36, -0.32],
        [0.68, 0.36, -0.32],
        [-0.68, 0.36, 0.32],
        [0.68, 0.36, 0.32],
      ] as const
    ).map((pos) => (
      <mesh key={pos.join(",")} position={[...pos]} castShadow>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
    ))}
    <mesh position={[0, 1.08, -0.22]} castShadow>
      <boxGeometry args={[0.62, 0.42, 0.08]} />
      <meshStandardMaterial color="#1f2933" />
    </mesh>
    <mesh position={[0, 1.08, -0.176]}>
      <planeGeometry args={[0.54, 0.34]} />
      <meshStandardMaterial
        color={glow ? "#7dd3fc" : "#082f49"}
        emissive={glow ? "#38bdf8" : "#022c4a"}
        emissiveIntensity={glow ? 0.85 : 0.15}
      />
    </mesh>
    <mesh position={[0, 0.775, 0.08]}>
      <boxGeometry args={[0.7, 0.02, 0.28]} />
      <meshStandardMaterial color="#111827" />
    </mesh>
  </group>
);

export const TeamRug = ({
  team,
  x,
  z,
  w,
  d,
}: {
  team: TeamId;
  x: number;
  z: number;
  w: number;
  d: number;
}) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={TEAMS[team].rug} roughness={0.9} />
    </mesh>
    <Text
      position={[0, 2.35, 0]}
      fontSize={0.32}
      color={TEAMS[team].color}
      outlineWidth={0.02}
      outlineColor="#1c1410"
      anchorX="center"
      anchorY="middle"
    >
      {TEAMS[team].label}
    </Text>
  </group>
);

export const MeetingTable = () => (
  <group position={[0, 0, 0.15]}>
    <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[1.35, 1.35, 0.08, 24]} />
      <meshStandardMaterial color={WOOD} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.36, 0]} castShadow>
      <cylinderGeometry args={[0.18, 0.28, 0.72, 12]} />
      <meshStandardMaterial color={WOOD_DARK} />
    </mesh>
    <mesh position={[0, 0.78, 0]}>
      <cylinderGeometry args={[0.45, 0.45, 0.02, 16]} />
      <meshStandardMaterial color="#e7d6b8" />
    </mesh>
    <Text
      position={[0, 1.55, 0]}
      fontSize={0.22}
      color="#fde68a"
      outlineWidth={0.014}
      outlineColor="#1c1410"
    >
      STANDUP
    </Text>
  </group>
);

export const ReviewBay = () => (
  <group position={[0.2, 0, -7.15]}>
    <mesh position={[0, 1.6, -1.15]} receiveShadow>
      <boxGeometry args={[7.2, 3.2, 0.16]} />
      <meshStandardMaterial color={PLASTER} />
    </mesh>
    <mesh position={[-3.6, 1.6, 0.2]} receiveShadow>
      <boxGeometry args={[0.16, 3.2, 2.7]} />
      <meshStandardMaterial color={PLASTER} />
    </mesh>
    <mesh position={[3.6, 1.6, 0.2]} receiveShadow>
      <boxGeometry args={[0.16, 3.2, 2.7]} />
      <meshStandardMaterial color={PLASTER} />
    </mesh>
    <mesh position={[0, 1.55, -0.95]}>
      <boxGeometry args={[3.6, 1.5, 0.06]} />
      <meshStandardMaterial color="#0b1220" />
    </mesh>
    <mesh position={[0, 1.55, -0.91]}>
      <planeGeometry args={[3.3, 1.25]} />
      <meshStandardMaterial
        color="#1e1b4b"
        emissive="#7c3aed"
        emissiveIntensity={0.45}
      />
    </mesh>
    <Text
      position={[0, 1.55, -0.88]}
      fontSize={0.28}
      color="#f5f3ff"
      anchorX="center"
    >
      PR REVIEW
    </Text>
    {[-2.4, 2.4].map((x) => (
      <group key={x} position={[x, 0, -0.35]}>
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.7, 1.9, 0.45]} />
          <meshStandardMaterial color="#1f2937" metalness={0.3} />
        </mesh>
        {[-0.22, 0, 0.22].map((y, i) => (
          <mesh key={y} position={[0.32, 1.15 + y, 0]}>
            <boxGeometry args={[0.06, 0.08, 0.08]} />
            <meshStandardMaterial
              color={i === 1 ? "#34d399" : "#f59e0b"}
              emissive={i === 1 ? "#34d399" : "#f59e0b"}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>
    ))}
    <Text
      position={[0, 2.55, 0.4]}
      fontSize={0.24}
      color="#c4b5fd"
      outlineWidth={0.016}
      outlineColor="#1c1410"
    >
      REVIEW
    </Text>
  </group>
);

export const Plant = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 0.22, 0]}>
      <cylinderGeometry args={[0.16, 0.2, 0.32, 10]} />
      <meshStandardMaterial color="#7c2d12" />
    </mesh>
    <mesh position={[0, 0.55, 0]} castShadow>
      <sphereGeometry args={[0.28, 10, 8]} />
      <meshStandardMaterial color="#15803d" />
    </mesh>
    <mesh position={[0.12, 0.72, 0.04]}>
      <sphereGeometry args={[0.16, 8, 8]} />
      <meshStandardMaterial color="#16a34a" />
    </mesh>
  </group>
);

export const Whiteboard = () => (
  <group position={[-2.6, 1.5, 8.55]}>
    <mesh>
      <boxGeometry args={[2.2, 1.2, 0.06]} />
      <meshStandardMaterial color="#f8fafc" />
    </mesh>
    <mesh position={[0, 0, 0.04]}>
      <planeGeometry args={[1.9, 0.9]} />
      <meshStandardMaterial color="#e2e8f0" />
    </mesh>
  </group>
);

export const OfficeShell = () => {
  const { width: w, depth: d, wallHeight: h, wallThickness: t } = {
    width: 24,
    depth: 18,
    wallHeight: 3.2,
    wallThickness: 0.18,
  };
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial color={PLASTER} />
      </mesh>
      <mesh position={[0, h / 2, d / 2]} receiveShadow>
        <boxGeometry args={[w, h, t]} />
        <meshStandardMaterial color={PLASTER} />
      </mesh>
      <mesh position={[-w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial color={PLASTER} />
      </mesh>
      <mesh position={[w / 2, h / 2, 0]} receiveShadow>
        <boxGeometry args={[t, h, d]} />
        <meshStandardMaterial color={PLASTER} />
      </mesh>
      <mesh position={[0, 0.04, 8.65]}>
        <boxGeometry args={[w, 0.12, 0.28]} />
        <meshStandardMaterial color={TRIM} />
      </mesh>
    </group>
  );
};
