import { Grid, useTexture } from '@react-three/drei';
import { useMemo } from 'react';
import { Color, RepeatWrapping } from 'three';
import { GRID_VISUAL_TOKENS } from '@/lib/grid-ops/visualConfig';

interface GridGroundProps {
  activationRatio: number;
}

export function GridGround({ activationRatio }: GridGroundProps) {
  const floorTexture = useTexture('/grid-assets/textures/grid-floor.svg');

  const glowColor = useMemo(() => {
    const base = new Color(GRID_VISUAL_TOKENS.gridBgDark);
    const lift = new Color(GRID_VISUAL_TOKENS.accentGreen);
    return base.lerp(lift, Math.min(0.34, Math.max(0.1, activationRatio * 0.28)));
  }, [activationRatio]);

  floorTexture.wrapS = RepeatWrapping;
  floorTexture.wrapT = RepeatWrapping;
  floorTexture.repeat.set(2, 2);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
        receiveShadow
      >
        <planeGeometry args={[17.6, 9.4, 1, 1]} />
        <meshStandardMaterial
          color={glowColor}
          map={floorTexture}
          emissive={GRID_VISUAL_TOKENS.accentGreen}
          emissiveIntensity={0.08 + activationRatio * 0.06}
          roughness={0.9}
          metalness={0.08}
        />
      </mesh>

      <Grid
        args={[17.6, 9.4]}
        cellSize={0.34}
        cellThickness={0.55}
        sectionSize={1.7}
        sectionThickness={1.1}
        sectionColor={GRID_VISUAL_TOKENS.accentGreen}
        cellColor={GRID_VISUAL_TOKENS.muted}
        fadeDistance={18}
        fadeStrength={1.15}
        infiniteGrid
        position={[0, -0.099, 0]}
      />

    </group>
  );
}
