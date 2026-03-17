'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color } from 'three';
import type { Group } from 'three';
import { TIER_COLORS, type CharacterTierId } from '@/lib/energy';

interface Props {
  tier: CharacterTierId;
}

export function EngineerFigure({ tier }: Props) {
  const groupRef = useRef<Group>(null);
  const { primary } = TIER_COLORS[tier];
  const tierColor = new Color(primary);
  const darkSuit = new Color('#1a2a22');
  const darkAccent = new Color('#0f1a14');

  // Subtle breathing idle animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.1) * 0.013;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.08, 0]}>
      {/* ── Boots ──────────────────────────────────────────────── */}
      <mesh position={[-0.135, -1.01, 0.03]} castShadow>
        <boxGeometry args={[0.20, 0.12, 0.26]} />
        <meshStandardMaterial color={darkAccent} roughness={0.9} />
      </mesh>
      <mesh position={[0.135, -1.01, 0.03]} castShadow>
        <boxGeometry args={[0.20, 0.12, 0.26]} />
        <meshStandardMaterial color={darkAccent} roughness={0.9} />
      </mesh>

      {/* ── Legs ───────────────────────────────────────────────── */}
      <mesh position={[-0.135, -0.72, 0]} castShadow>
        <boxGeometry args={[0.18, 0.52, 0.18]} />
        <meshStandardMaterial color={darkSuit} roughness={0.8} />
      </mesh>
      <mesh position={[0.135, -0.72, 0]} castShadow>
        <boxGeometry args={[0.18, 0.52, 0.18]} />
        <meshStandardMaterial color={darkSuit} roughness={0.8} />
      </mesh>

      {/* ── Torso (safety vest) ────────────────────────────────── */}
      <mesh position={[0, -0.20, 0]} castShadow>
        <boxGeometry args={[0.52, 0.64, 0.28]} />
        <meshStandardMaterial color={tierColor} roughness={0.55} metalness={0.08} />
      </mesh>
      {/* Chest reflective stripe */}
      <mesh position={[0, -0.12, 0.145]}>
        <boxGeometry args={[0.46, 0.08, 0.005]} />
        <meshStandardMaterial
          color="#f5e070"
          roughness={0.5}
          emissive="#f5e070"
          emissiveIntensity={0.20}
        />
      </mesh>
      {/* Waist stripe */}
      <mesh position={[0, -0.38, 0.145]}>
        <boxGeometry args={[0.46, 0.06, 0.005]} />
        <meshStandardMaterial
          color="#f5e070"
          roughness={0.5}
          emissive="#f5e070"
          emissiveIntensity={0.20}
        />
      </mesh>

      {/* ── Left arm (relaxed down) ────────────────────────────── */}
      <mesh position={[-0.37, -0.28, 0]} castShadow>
        <boxGeometry args={[0.15, 0.52, 0.16]} />
        <meshStandardMaterial color={darkSuit} roughness={0.75} />
      </mesh>
      <mesh position={[-0.37, -0.58, 0]} castShadow>
        <boxGeometry args={[0.14, 0.16, 0.14]} />
        <meshStandardMaterial color="#2a3a30" roughness={0.9} />
      </mesh>

      {/* ── Right arm (raised, holding tablet) ────────────────── */}
      <group position={[0.36, -0.18, 0]} rotation={[0, 0, -0.5]}>
        {/* Upper arm */}
        <mesh position={[0, -0.14, 0]} castShadow>
          <boxGeometry args={[0.15, 0.32, 0.16]} />
          <meshStandardMaterial color={darkSuit} roughness={0.75} />
        </mesh>
        {/* Forearm with tablet */}
        <group position={[0.14, -0.40, 0.10]} rotation={[0.55, 0, 0.45]}>
          {/* Tablet body */}
          <mesh castShadow>
            <boxGeometry args={[0.26, 0.20, 0.028]} />
            <meshStandardMaterial color="#0d1810" roughness={0.4} metalness={0.65} />
          </mesh>
          {/* Tablet screen — emissive tier color */}
          <mesh position={[0, 0, 0.016]}>
            <boxGeometry args={[0.22, 0.16, 0.002]} />
            <meshStandardMaterial
              color={primary}
              emissive={primary}
              emissiveIntensity={1.1}
              roughness={0.05}
            />
          </mesh>
        </group>
      </group>

      {/* ── Neck ───────────────────────────────────────────────── */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.095, 0.105, 0.14, 6]} />
        <meshStandardMaterial color="#2a3830" roughness={0.8} />
      </mesh>

      {/* ── Head ───────────────────────────────────────────────── */}
      <mesh position={[0, 0.44, 0]} castShadow>
        <boxGeometry args={[0.32, 0.30, 0.28]} />
        <meshStandardMaterial color="#344a3e" roughness={0.7} />
      </mesh>
      {/* Face visor / eye slit */}
      <mesh position={[0, 0.445, 0.143]}>
        <boxGeometry args={[0.22, 0.075, 0.003]} />
        <meshStandardMaterial
          color={primary}
          emissive={primary}
          emissiveIntensity={0.7}
          roughness={0.1}
        />
      </mesh>

      {/* ── Hard hat brim ──────────────────────────────────────── */}
      <mesh position={[0, 0.61, 0]}>
        <cylinderGeometry args={[0.245, 0.225, 0.05, 8]} />
        <meshStandardMaterial color={tierColor} roughness={0.48} metalness={0.14} />
      </mesh>
      {/* Hard hat dome */}
      <mesh position={[0, 0.735, 0]}>
        <sphereGeometry args={[0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={tierColor} roughness={0.48} metalness={0.14} />
      </mesh>
      {/* Hat reflective stripe */}
      <mesh position={[0, 0.638, 0.198]}>
        <boxGeometry args={[0.38, 0.022, 0.008]} />
        <meshStandardMaterial
          color="#f5e070"
          roughness={0.5}
          emissive="#f5e070"
          emissiveIntensity={0.22}
        />
      </mesh>
      {/* Helmet status light */}
      <mesh position={[0.08, 0.72, 0.18]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial
          color={primary}
          emissive={primary}
          emissiveIntensity={2.0}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

export function Platform({ tier }: { tier: CharacterTierId }) {
  const { primary } = TIER_COLORS[tier];
  return (
    <group position={[0, -1.16, 0]}>
      {/* Base disc */}
      <mesh receiveShadow>
        <cylinderGeometry args={[0.92, 0.92, 0.07, 32]} />
        <meshStandardMaterial color="#0a1510" roughness={0.55} metalness={0.35} />
      </mesh>
      {/* Inner detail ring */}
      <mesh position={[0, 0.04, 0]}>
        <torusGeometry args={[0.60, 0.018, 8, 64]} />
        <meshStandardMaterial color="#1a2e22" roughness={0.6} />
      </mesh>
      {/* Outer glowing ring */}
      <mesh position={[0, 0.04, 0]}>
        <torusGeometry args={[0.84, 0.028, 8, 64]} />
        <meshStandardMaterial
          color={primary}
          emissive={primary}
          emissiveIntensity={1.4}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
