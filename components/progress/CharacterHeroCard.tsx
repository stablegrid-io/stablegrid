'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3, type Group } from 'three';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  getLevelProgress,
  TIER_COLORS,
  type CharacterTierId
} from '@/lib/energy';

const CHARACTER_MODEL_URL = '/grid-assets/models/character.glb';

const TIER_LABEL: Record<CharacterTierId, string> = {
  cadet: 'Grid Cadet',
  engineer: 'Grid Engineer',
  architect: 'Grid Architect',
  commander: 'Grid Commander'
};

function CharacterMesh({ color }: { color: string }) {
  const gltf = useGLTF(CHARACTER_MODEL_URL);
  const groupRef = useRef<Group>(null);

  const { scaleFactor, offset } = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.2 / Math.max(0.001, maxDim);
    return {
      scaleFactor: scale,
      offset: [-center.x * scale, -center.y * scale, -center.z * scale] as [number, number, number]
    };
  }, [gltf.scene]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * (Math.PI * 2 / 9);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive
        object={gltf.scene}
        scale={[scaleFactor, scaleFactor, scaleFactor]}
        position={offset}
      />
      <pointLight color={color} intensity={1.2} distance={6} position={[0, 0.5, 2]} />
    </group>
  );
}

function CharacterFigure({ color }: { color: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-25 blur-[60px]"
        style={{ background: color }}
      />
      <div style={{ width: 200, height: 240 }}>
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0.1, 3.2], fov: 38, near: 0.1, far: 20 }}
        >
          <ambientLight intensity={0.6} color="#e8f0ff" />
          <directionalLight intensity={0.95} color="#ffffff" position={[2.5, 4, 2]} />
          <directionalLight intensity={0.3} color="#88ccaa" position={[-3, 1, -1]} />
          <Suspense fallback={null}>
            <CharacterMesh color={color} />
          </Suspense>
        </Canvas>
      </div>
      <div
        className="mt-[-8px] h-3 w-20 rounded-full opacity-25 blur-[8px]"
        style={{ background: color }}
      />
    </div>
  );
}

useGLTF.preload(CHARACTER_MODEL_URL);

interface CharacterHeroCardProps {
  serverXp?: number;
}

export function CharacterHeroCard({ serverXp = 0 }: CharacterHeroCardProps) {
  const storeXp = useProgressStore((s) => s.xp);
  const xp = storeXp > 0 ? storeXp : serverXp;

  const { current, next, progressPct, unitsNeededForNext } = getLevelProgress(xp);
  const tierColor = TIER_COLORS[current.tier];
  const filledSegments = Math.round((next ? progressPct : 100) / 5);

  return (
    <div
      className="group relative overflow-hidden rounded-[20px] border"
      style={{
        background: 'linear-gradient(145deg, rgba(10,18,14,0.98), rgba(6,10,8,0.99))',
        borderColor: `${tierColor.primary}25`
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[1.5px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 5%, ${tierColor.primary}80, ${tierColor.primary}30 60%, transparent 95%)`
        }}
      />

      {/* Corner accents */}
      <span className="absolute left-4 top-4 h-4 w-4 border-l border-t" style={{ borderColor: `${tierColor.primary}30` }} />
      <span className="absolute right-4 top-4 h-4 w-4 border-r border-t" style={{ borderColor: `${tierColor.primary}30` }} />
      <span className="absolute bottom-4 left-4 h-4 w-4 border-b border-l" style={{ borderColor: `${tierColor.primary}18` }} />
      <span className="absolute bottom-4 right-4 h-4 w-4 border-b border-r" style={{ borderColor: `${tierColor.primary}18` }} />

      {/* Background radial glows */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] opacity-[0.08] blur-[80px]"
        style={{ background: tierColor.primary }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 right-[20%] h-[200px] w-[300px] opacity-[0.04] blur-[60px]"
        style={{ background: tierColor.primary }}
      />

      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative flex flex-col items-center gap-4 px-6 pb-8 pt-6 sm:flex-row sm:items-stretch sm:gap-8 sm:px-8 sm:pb-9 sm:pt-7">
        {/* Character column */}
        <div className="flex flex-col items-center gap-4 sm:w-52 sm:flex-shrink-0">
          <CharacterFigure color={tierColor.primary} />

          {/* Tier badge */}
          <div
            className="rounded-[10px] border px-4 py-2 text-center backdrop-blur-sm"
            style={{
              borderColor: `${tierColor.primary}30`,
              background: `linear-gradient(135deg, ${tierColor.primary}12, ${tierColor.primary}06)`
            }}
          >
            <p
              className="font-mono text-[8px] font-bold uppercase tracking-[0.35em]"
              style={{ color: `${tierColor.primary}` }}
            >
              {current.tier}
            </p>
            <p className="mt-1 font-mono text-[13px] font-bold uppercase tracking-[0.06em] text-white/90">
              {TIER_LABEL[current.tier]}
            </p>
          </div>
        </div>

        {/* Info column */}
        <div className="flex flex-1 flex-col justify-between gap-6">
          {/* Level display */}
          <div>
            <div className="flex items-baseline gap-4">
              <span
                className="font-mono text-[4.5rem] font-black leading-none tabular-nums"
                style={{
                  color: tierColor.primary,
                  textShadow: `0 0 60px ${tierColor.primary}40, 0 0 120px ${tierColor.primary}15`
                }}
              >
                {current.level}
              </span>
              <div>
                <p
                  className="font-mono text-[9px] font-semibold uppercase tracking-[0.35em]"
                  style={{ color: `${tierColor.primary}90` }}
                >
                  Level
                </p>
                <p className="mt-1 font-mono text-xl font-bold uppercase tracking-[0.04em] text-white">
                  {current.title}
                </p>
              </div>
            </div>

            <p className="mt-3 font-mono text-[11px] font-bold tabular-nums text-white/50">
              {xp.toLocaleString()} XP
            </p>
          </div>

          {/* Progress section */}
          <div className="space-y-3">
            {next ? (
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="uppercase tracking-[0.2em] text-white/35">
                  {progressPct}%
                </span>
                <span className="uppercase tracking-[0.15em] text-white/35">
                  {unitsNeededForNext.toLocaleString()} XP to {next.title}
                </span>
              </div>
            ) : (
              <p className="font-mono text-[10px] font-semibold" style={{ color: tierColor.primary }}>Max Level</p>
            )}

            {/* Segmented progress bar */}
            <div className="flex gap-[4px]">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[7px] flex-1 rounded-[2px] transition-all duration-500"
                  style={{
                    background:
                      i < filledSegments
                        ? `linear-gradient(180deg, ${tierColor.primary}, ${tierColor.primary}cc)`
                        : 'rgba(255,255,255,0.04)',
                    boxShadow:
                      i < filledSegments
                        ? `0 0 6px ${tierColor.primary}40, 0 1px 2px ${tierColor.primary}20`
                        : 'inset 0 1px 0 rgba(255,255,255,0.02)'
                  }}
                />
              ))}
            </div>

            {next && (
              <p
                className="text-right font-mono text-[9px] font-medium uppercase tracking-[0.2em]"
                style={{ color: `${tierColor.primary}70` }}
              >
                Next: {next.title} (Lv {next.level})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${tierColor.primary}15, transparent)`
        }}
      />
    </div>
  );
}
