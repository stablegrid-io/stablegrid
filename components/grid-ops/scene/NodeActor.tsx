import { Billboard, Clone, Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  Activity,
  ArrowLeftRight,
  BatteryCharging,
  Bot,
  Gauge,
  PlugZap,
  Radar,
  RefreshCcw,
  Sun,
  type LucideIcon
} from 'lucide-react';
import { useMemo, useRef } from 'react';
import {
  Box3,
  MeshStandardMaterial,
  Vector3,
  type Mesh
} from 'three';
import type { GridSceneAssetDescriptor } from '@/lib/grid-ops/sceneAssets';
import type { GridSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';
import type {
  GridOpsAssetView,
  GridOpsNodeView,
  GridOpsVisualCategory,
  GridOpsVisualIcon
} from '@/lib/grid-ops/types';
import { GRID_VISUAL_TOKENS } from '@/lib/grid-ops/visualConfig';
import { cloneSceneWithDetachedMaterials } from '@/components/grid-ops/scene/cloneSceneWithDetachedMaterials';

interface NodeActorProps {
  node: GridOpsNodeView;
  asset: GridOpsAssetView;
  position: { x: number; y: number; z: number };
  showLabel: boolean;
  showMicro: boolean;
  qualityCaps: GridSceneRuntimeCaps;
  assetDescriptor: GridSceneAssetDescriptor | null;
  modelAvailable: boolean;
  renderModel: boolean;
  reducedMotion: boolean;
  focused: boolean;
  connected: boolean;
  highlighted: boolean;
  deploying: boolean;
  recommended: boolean;
  onHoverChange: (nodeId: string | null) => void;
}

function ModelCore({
  descriptor
}: {
  descriptor: GridSceneAssetDescriptor;
}) {
  const gltf = useGLTF(descriptor.url);

  const normalizedModel = useMemo(() => {
    const scene = cloneSceneWithDetachedMaterials(gltf.scene);
    const box = new Box3().setFromObject(scene);
    const size = new Vector3();
    const center = new Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDimension = Math.max(0.001, size.x, size.y, size.z);
    const scaleFactor = descriptor.scale / maxDimension;
    const minY = box.min.y;
    scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) {
        return;
      }

      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    return {
      scene,
      scaleFactor,
      position: [-center.x * scaleFactor, -minY * scaleFactor, -center.z * scaleFactor] as [
        number,
        number,
        number
      ]
    };
  }, [descriptor.scale, gltf.scene]);

  return (
    <group
      position={[0, descriptor.yOffset, 0]}
      rotation={[0, descriptor.yaw, 0]}
    >
      <Clone
        object={normalizedModel.scene}
        position={normalizedModel.position}
        scale={[normalizedModel.scaleFactor, normalizedModel.scaleFactor, normalizedModel.scaleFactor]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

const CATEGORY_COLOR: Record<GridOpsVisualCategory, string> = {
  monitoring: GRID_VISUAL_TOKENS.accentGreen,
  control: GRID_VISUAL_TOKENS.accentBlue,
  forecasting: GRID_VISUAL_TOKENS.accentAmber,
  flexibility: GRID_VISUAL_TOKENS.accentPurple,
  reinforcement: '#8fa8a0'
};

const STATE_COLOR: Record<GridOpsNodeView['state'], string> = {
  offline: '#5f6d68',
  connected: GRID_VISUAL_TOKENS.accentGreen,
  stabilized: GRID_VISUAL_TOKENS.accentBlue,
  optimized: '#7dd3ff'
};

const ICON_BY_VISUAL: Record<GridOpsVisualIcon, LucideIcon> = {
  radar: Radar,
  transformer: Gauge,
  sun: Sun,
  battery: BatteryCharging,
  frequency: Activity,
  demand: PlugZap,
  flywheel: RefreshCcw,
  hvdc: ArrowLeftRight,
  ai: Bot
};

const toShortLabel = (name: string) => {
  const clean = name.replace(/\(.*?\)/g, '').replace(/\bSystem\b/gi, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(' ');
};

const toMicroLabel = (node: GridOpsNodeView, asset: GridOpsAssetView) => {
  if (node.micro_indicator === 'forecast_pct') {
    return `${Math.min(99, 40 + asset.effects.forecast * 2)}% FCST`;
  }

  if (node.micro_indicator === 'sync') {
    return 'SYNC ONLINE';
  }

  if (node.micro_indicator === 'flow_route') {
    return 'FLOW ROUTE';
  }

  if (node.micro_indicator === 'waveform') {
    return 'WAVEFORM';
  }

  return 'BAT';
};

export function NodeActor({
  node,
  asset,
  position,
  showLabel,
  showMicro,
  qualityCaps,
  assetDescriptor,
  modelAvailable,
  renderModel,
  reducedMotion,
  focused,
  connected,
  highlighted,
  deploying,
  recommended,
  onHoverChange
}: NodeActorProps) {
  const outerRingRef = useRef<Mesh>(null);
  const categoryRingRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  const visualCategory = node.visual_category ?? asset.category;
  const visualIcon = node.visual_icon ?? assetDescriptor?.fallbackIcon ?? 'transformer';
  const isBatteryNode = node.id === 'battery-storage';
  const iconColor = isBatteryNode ? GRID_VISUAL_TOKENS.accentAmber : CATEGORY_COLOR[visualCategory];
  const stateColor = STATE_COLOR[node.state];
  const Icon = ICON_BY_VISUAL[visualIcon];

  const baseRadius = useMemo(() => {
    if (node.importance === 'anchor') {
      return 0.52;
    }

    if (node.importance === 'primary') {
      return 0.47;
    }

    return 0.42;
  }, [node.importance]);

  useFrame((clock) => {
    const elapsed = clock.clock.getElapsedTime();

    if (outerRingRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(elapsed * 2.2 + position.x) * 0.025;
      const deployPulse = deploying ? 1.08 + Math.sin(elapsed * 9) * 0.07 : 1;
      outerRingRef.current.scale.setScalar(pulse * deployPulse);
    }

    if (categoryRingRef.current && !reducedMotion) {
      const velocity =
        visualCategory === 'forecasting'
          ? 0.25
          : visualCategory === 'control'
            ? 0.18
            : visualCategory === 'monitoring'
              ? -0.15
              : 0.1;
      categoryRingRef.current.rotation.z = elapsed * velocity;
    }

    if (coreRef.current && !reducedMotion) {
      const intensity = highlighted || deploying ? 0.44 : connected ? 0.28 : 0.14;
      coreRef.current.position.y = 0.08 + Math.sin(elapsed * 2 + position.z) * 0.012;
      if (coreRef.current.material instanceof MeshStandardMaterial) {
        coreRef.current.material.emissiveIntensity = intensity;
      }
    }
  });

  const dimmed = !focused && !highlighted;
  const batteryFill = Math.min(96, Math.max(22, 34 + asset.effects.riskMitigation * 2));
  const batteryBarFillColor = isBatteryNode ? '#5CA8FF' : '#9C6BFF';
  const batteryBarBgColor = isBatteryNode ? '#273758' : '#243d35';
  return (
    <group
      position={[position.x, 0.08, position.z]}
      onPointerOver={() => onHoverChange(node.id)}
      onPointerOut={() => onHoverChange(null)}
      scale={dimmed ? 0.93 : 1}
    >
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[baseRadius + 0.14, 0.032, 18, 64]} />
        <meshStandardMaterial
          color={stateColor}
          emissive={stateColor}
          emissiveIntensity={node.state === 'offline' ? 0.05 : highlighted ? 0.62 : 0.34}
          transparent
          opacity={dimmed ? 0.4 : 0.95}
        />
      </mesh>

      <mesh ref={categoryRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[baseRadius, 0.03, 16, 56]} />
        <meshStandardMaterial
          color={iconColor}
          emissive={iconColor}
          emissiveIntensity={highlighted ? 0.44 : 0.21}
          transparent
          opacity={node.state === 'offline' ? 0.45 : 0.88}
        />
      </mesh>

      {visualCategory === 'forecasting' ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[baseRadius - 0.08, 0.015, 14, 48]} />
          <meshStandardMaterial
            color={iconColor}
            emissive={iconColor}
            emissiveIntensity={0.25}
            transparent
            opacity={0.7}
          />
        </mesh>
      ) : null}

      {!assetDescriptor || !modelAvailable || !renderModel ? (
        <mesh ref={coreRef} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[baseRadius - 0.12, baseRadius - 0.12, 0.12, 40]} />
          <meshStandardMaterial
            color="#08130f"
            emissive={iconColor}
            emissiveIntensity={0.24}
            roughness={0.55}
            metalness={0.32}
            transparent
            opacity={dimmed ? 0.75 : 0.96}
          />
        </mesh>
      ) : null}

      {assetDescriptor && modelAvailable && renderModel ? (
        <ModelCore
          descriptor={assetDescriptor}
        />
      ) : null}

      <Billboard follow position={[0, 0.23, 0]}>
        <Html center transform={false} occlude={false}>
          <div
            data-grid-node={node.id}
            data-node-state={node.state}
            data-node-category={visualCategory}
            className="pointer-events-none flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-[#06110d]/90 text-white shadow-[0_8px_20px_rgba(0,0,0,0.45)]"
            style={{
              color: iconColor,
              opacity: dimmed ? 0.68 : 1
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={2.1} />
          </div>
        </Html>
      </Billboard>

      {showLabel || highlighted ? (
        <Billboard follow position={[0, 0.1, 0.58]}>
          <Html center transform={false} occlude={false}>
            <p
              className="pointer-events-none whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{
                color: highlighted ? '#ebfff5' : '#c6ddd1',
                opacity: dimmed ? 0.48 : 0.95
              }}
            >
              {toShortLabel(asset.name)}
            </p>
          </Html>
        </Billboard>
      ) : null}

      {showMicro || highlighted ? (
        <Billboard follow position={[0, 0.06, 0.86]}>
          <Html center transform={false} occlude={false}>
            <div className="pointer-events-none flex items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-[#9dc7b5]">
              {node.micro_indicator === 'battery_bar' ? (
                <>
                  <span>BAT</span>
                  <div className="h-1 w-10 overflow-hidden rounded-full" style={{ backgroundColor: batteryBarBgColor }}>
                    <div className="h-full rounded-full" style={{ width: `${batteryFill}%`, backgroundColor: batteryBarFillColor }} />
                  </div>
                </>
              ) : (
                <span>{toMicroLabel(node, asset)}</span>
              )}
              {recommended && qualityCaps.profile === 'desktop' ? <span className="text-emerald-300">REC</span> : null}
            </div>
          </Html>
        </Billboard>
      ) : null}
    </group>
  );
}
