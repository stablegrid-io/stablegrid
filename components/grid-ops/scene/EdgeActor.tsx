import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  TubeGeometry,
  Vector3
} from 'three';
import type { GridOpsEdgeView } from '@/lib/grid-ops/types';
import type { GridSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';
import { GRID_VISUAL_TOKENS } from '@/lib/grid-ops/visualConfig';

interface EdgeActorProps {
  edge: GridOpsEdgeView;
  from: { x: number; y: number; z: number };
  to: { x: number; y: number; z: number };
  risk: number;
  focused: boolean;
  highlighted: boolean;
  deploying: boolean;
  reducedMotion: boolean;
  animate: boolean;
  pulseEnabled: boolean;
  qualityCaps: GridSceneRuntimeCaps;
}

type EdgeState = 'inactive' | 'active' | 'stressed' | 'faulted';

const toEdgeState = ({
  edge,
  risk
}: {
  edge: GridOpsEdgeView;
  risk: number;
}): EdgeState => {
  if (!edge.energized) {
    return 'inactive';
  }

  if (edge.unstable && risk >= 68) {
    return 'faulted';
  }

  if (edge.unstable) {
    return 'stressed';
  }

  return 'active';
};

const EDGE_STYLE: Record<EdgeState, { color: string; dash: boolean; opacity: number }> = {
  inactive: {
    color: '#4A5C56',
    dash: false,
    opacity: 0.52
  },
  active: {
    color: GRID_VISUAL_TOKENS.accentBlue,
    dash: false,
    opacity: 0.92
  },
  stressed: {
    color: GRID_VISUAL_TOKENS.accentAmber,
    dash: true,
    opacity: 0.9
  },
  faulted: {
    color: GRID_VISUAL_TOKENS.accentRed,
    dash: true,
    opacity: 0.86
  }
};

const resolveLaneOffset = (edgeId: string) => {
  let hash = 0;
  for (let i = 0; i < edgeId.length; i += 1) {
    hash = (hash * 31 + edgeId.charCodeAt(i)) | 0;
  }

  const lane = ((hash % 3) + 3) % 3;
  if (lane === 0) return 0;
  return lane === 1 ? -1 : 1;
};

export function EdgeActor({
  edge,
  from,
  to,
  risk,
  focused,
  highlighted,
  deploying,
  reducedMotion,
  animate,
  pulseEnabled,
  qualityCaps
}: EdgeActorProps) {
  const edgeState = toEdgeState({ edge, risk });
  const tubeRef = useRef<Mesh | null>(null);
  const pulseRef = useRef<any>(null);
  const pulseProgress = useRef(Math.random());
  const textureOffsetRef = useRef(0);

  const curve = useMemo(() => {
    const start = new Vector3(from.x, 0.2, from.z);
    const end = new Vector3(to.x, 0.2, to.z);
    const delta = new Vector3().subVectors(end, start);
    const planarDistance = Math.max(0.001, Math.hypot(delta.x, delta.z));
    const lateral = new Vector3(-delta.z, 0, delta.x).multiplyScalar(1 / planarDistance);
    const directional = new Vector3(delta.x / planarDistance, 0, delta.z / planarDistance);
    const laneOffset = resolveLaneOffset(edge.id);
    const laneStrength = (edge.tier === 'backbone' ? 0.16 : 0.24) * Math.min(1.25, planarDistance / 2.2);
    const heightBase = edge.tier === 'backbone' ? 0.44 : 0.35;
    const spanLift = Math.min(0.12, planarDistance * 0.025);
    const midpoint = new Vector3(
      (from.x + to.x) * 0.5,
      heightBase + spanLift,
      (from.z + to.z) * 0.5
    );
    midpoint.addScaledVector(lateral, laneOffset * laneStrength);
    midpoint.addScaledVector(directional, 0.05);

    return new CatmullRomCurve3([start, midpoint, end]);
  }, [edge.id, edge.tier, from.x, from.z, to.x, to.z]);

  const geometry = useMemo(
    () =>
      new TubeGeometry(
        curve,
        42,
        edge.tier === 'backbone' ? 0.06 : 0.04,
        12,
        false
      ),
    [curve, edge.tier]
  );

  const flowTexture = useTexture('/grid-assets/textures/flow-strip.svg');
  flowTexture.wrapS = RepeatWrapping;
  flowTexture.wrapT = RepeatWrapping;
  flowTexture.repeat.set(5, 1);

  const style = EDGE_STYLE[edgeState];

  const opacity = (focused ? style.opacity : style.opacity * 0.24) * qualityCaps.flowOpacity;

  useFrame((clock, delta) => {
    const material = tubeRef.current?.material;
    if (material instanceof MeshStandardMaterial) {
      if (edgeState === 'faulted' && !reducedMotion && animate) {
        material.opacity = opacity * (0.72 + Math.sin(clock.clock.elapsedTime * 15) * 0.18);
      } else {
        material.opacity = opacity;
      }

      material.color.set(style.color);
      material.emissive.set(style.color);
      const emissiveBase = highlighted ? 0.98 : edgeState === 'inactive' ? 0.08 : 0.5;
      const emissivePulse =
        !reducedMotion && animate && edgeState !== 'inactive'
          ? Math.sin(clock.clock.elapsedTime * 6.4) * 0.12
          : 0;
      material.emissiveIntensity = emissiveBase + emissivePulse;

      if (!reducedMotion && animate && flowTexture) {
        const velocityBase = edgeState === 'stressed' ? 1.1 : 0.82;
        textureOffsetRef.current -= delta * velocityBase * qualityCaps.animationSpeedMultiplier;
        flowTexture.offset.x = textureOffsetRef.current;
      }
    }

    if (
      !pulseRef.current ||
      reducedMotion ||
      edgeState === 'inactive' ||
      edgeState === 'faulted' ||
      !animate ||
      !pulseEnabled
    ) {
      return;
    }

    const speedBoost = deploying ? 0.75 : 0;
    const speed =
      ((edgeState === 'active' ? 0.55 : 0.42) + speedBoost) *
      qualityCaps.animationSpeedMultiplier;
    pulseProgress.current = (pulseProgress.current + delta * speed) % 1;

    const pulsePoint = curve.getPoint(pulseProgress.current);
    pulseRef.current.position.copy(pulsePoint);

    const scale = edgeState === 'stressed' ? 1.45 : 1.1;
    const breathing = 1 + Math.sin(clock.clock.elapsedTime * 11) * 0.1;
    pulseRef.current.scale.setScalar((scale + (deploying ? 0.62 : 0)) * breathing);
  });

  return (
    <group>
      <mesh ref={tubeRef} geometry={geometry}>
        <meshStandardMaterial
          color={new Color(style.color)}
          emissive={new Color(style.color)}
          emissiveIntensity={edgeState === 'inactive' ? 0.06 : 0.38}
          map={flowTexture}
          transparent
          opacity={opacity}
          roughness={0.5}
          metalness={0.18}
          blending={AdditiveBlending}
        />
      </mesh>

      {pulseEnabled && (edgeState === 'active' || edgeState === 'stressed') ? (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial
            color={edgeState === 'stressed' ? GRID_VISUAL_TOKENS.accentAmber : '#81fff4'}
            transparent
            opacity={focused ? 0.9 : 0.45}
          />
        </mesh>
      ) : null}
    </group>
  );
}
