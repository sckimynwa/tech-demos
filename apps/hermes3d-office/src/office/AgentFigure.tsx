import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { AgentRuntime, Place, Vec2 } from "../domain/types";
import {
  ARRIVE_EPSILON,
  STATUS_COLOR,
  WALK_CYCLE,
  WALK_SPEED,
} from "./constants";

type AgentFigureProps = {
  agent: AgentRuntime;
  destination: Vec2;
  selected: boolean;
  onSelect: (id: string) => void;
};

export const AgentFigure = ({
  agent,
  destination,
  selected,
  onSelect,
}: AgentFigureProps) => {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const moving = useRef(false);
  const phase = useMemo(() => {
    let hash = 0;
    for (const char of agent.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return (Math.abs(hash) % 628) / 100;
  }, [agent.id]);
  const start = destination;
  const pos = useRef(new THREE.Vector3(start.x, 0, start.z));
  const target = useRef(new THREE.Vector3());
  const status = STATUS_COLOR[agent.state];

  useFrame((state, delta) => {
    const root = group.current;
    if (!root) return;
    target.current.set(destination.x, 0, destination.z);
    const to = target.current.clone().sub(pos.current);
    to.y = 0;
    const distance = to.length();
    const isMoving = distance > ARRIVE_EPSILON;
    moving.current = isMoving;
    if (isMoving) {
      to.normalize();
      pos.current.addScaledVector(to, Math.min(WALK_SPEED * delta, distance));
      const yaw = Math.atan2(to.x, to.z);
      let deltaYaw = yaw - root.rotation.y;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      root.rotation.y += deltaYaw * 0.18;
    } else {
      pos.current.lerp(target.current, 0.2);
      let deltaYaw = destination.facing - root.rotation.y;
      while (deltaYaw > Math.PI) deltaYaw -= Math.PI * 2;
      while (deltaYaw < -Math.PI) deltaYaw += Math.PI * 2;
      root.rotation.y += deltaYaw * 0.12;
    }
    root.position.copy(pos.current);
    const t = state.clock.elapsedTime * WALK_CYCLE + phase;
    const swing = isMoving ? Math.sin(t) * 0.7 : idleSwing(agent.place, t);
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = isMoving ? -swing : 0;
    if (rightLeg.current) rightLeg.current.rotation.x = isMoving ? swing : 0;
    if (agent.state === "working" && !isMoving && rightArm.current) {
      rightArm.current.rotation.x = -0.9 + Math.sin(t * 1.6) * 0.25;
    }
  });

  return (
    <group
      ref={group}
      position={[destination.x, 0, destination.z]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(agent.id);
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, selected ? 0.42 : 0.36, 24]} />
        <meshBasicMaterial
          color={selected ? "#fde68a" : status}
          transparent
          opacity={selected ? 0.95 : 0.55}
        />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <capsuleGeometry args={[0.22, 0.62, 6, 10]} />
        <meshStandardMaterial color={agent.color} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshStandardMaterial color="#f1d4b5" />
      </mesh>
      <mesh position={[0, 1.64, 0.02]}>
        <sphereGeometry args={[0.21, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <mesh position={[-0.07, 1.54, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <mesh position={[0.07, 1.54, 0.16]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
      <group ref={leftArm} position={[-0.3, 1.18, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
          <meshStandardMaterial color={agent.color} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.3, 1.18, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
          <meshStandardMaterial color={agent.color} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.1, 0.55, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.34, 4, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.1, 0.55, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.34, 4, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>
      <Billboard position={[0, 2.05, 0]}>
        <Text
          fontSize={0.2}
          color="#fff7ed"
          outlineWidth={0.012}
          outlineColor="#1c1410"
          anchorX="center"
        >
          {agent.name}
        </Text>
        <Text
          position={[0, -0.2, 0]}
          fontSize={0.12}
          color={status}
          outlineWidth={0.008}
          outlineColor="#1c1410"
          anchorX="center"
        >
          {agent.state}
        </Text>
      </Billboard>
    </group>
  );
};

const idleSwing = (place: Place, t: number) => {
  if (place === "meeting") return Math.sin(t * 0.35) * 0.18;
  if (place === "review") return Math.sin(t * 0.2) * 0.08;
  return Math.sin(t * 0.15) * 0.05;
};
