'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense } from 'react';
import { TIER_COLORS, type CharacterTierId } from '@/lib/energy';
import { EngineerFigure, Platform } from './EngineerFigure';

interface Props {
  tier: CharacterTierId;
}

export function CharacterViewer({ tier }: Props) {
  const { glow } = TIER_COLORS[tier];

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#060d0a]">
      {/* Atmospheric floor glow behind canvas */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at 50% 82%, ${glow} 0%, transparent 58%)`
        }}
      />
      <Canvas
        camera={{ position: [0, 1.1, 3.9], fov: 42 }}
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[2.5, 4.5, 2.5]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[512, 512]}
          />
          <pointLight position={[-2, 1.5, 1.5]} intensity={0.55} color="#22b999" />
          <pointLight position={[2, 0.5, -1.5]} intensity={0.25} color={TIER_COLORS[tier].primary} />

          {/* Character */}
          <EngineerFigure tier={tier} />
          <Platform tier={tier} />

          {/* Camera controls — auto-rotates, no zoom, clamped angle */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 3.8}
            maxPolarAngle={Math.PI / 2.05}
            autoRotate
            autoRotateSpeed={0.85}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
