import { Billboard, Clone, Html, useGLTF } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import {
  Object3D,
  MeshStandardMaterial,
  Vector3,
  type Group,
  type Mesh
} from 'three';
import type { GridSceneAssetDescriptor } from '@/lib/grid-ops/sceneAssets';
import type { GridSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';
import type {
  GridOpsAssetView,
  GridOpsNodeView,
  GridOpsVisualCategory
} from '@/lib/grid-ops/types';
import { GRID_VISUAL_TOKENS } from '@/lib/grid-ops/visualConfig';
import { cloneSceneWithDetachedMaterials } from '@/components/grid-ops/scene/cloneSceneWithDetachedMaterials';
import { computeMeshBounds } from '@/components/grid-ops/scene/computeMeshBounds';
import { tuneGridModelMaterials } from '@/components/grid-ops/scene/tuneGridModelMaterials';

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
  onSelect: (nodeId: string) => void;
}

type RotationAxis = 'x' | 'y' | 'z';

interface AnimatedRotationPart {
  axis: RotationAxis;
  baseRotation: number;
  direction: 1 | -1;
  mode: 'spin' | 'sway';
  object: Object3D;
  phase: number;
}

interface AnimatedPulseMaterial {
  material: MeshStandardMaterial;
  phase: number;
  weight: number;
}

interface ModelMotionProfile {
  bobAmplitude: number;
  bobSpeed: number;
  pulseBase: number;
  pulseBoost: number;
  spinSpeed: number;
  swayAmplitude: number;
  swaySpeed: number;
  tiltAmplitude: number;
  tiltSpeed: number;
}

function ModelCore({
  descriptor
}: {
  descriptor: GridSceneAssetDescriptor;
}) {
  const gltf = useGLTF(descriptor.url);

  const normalizedModel = useMemo(() => {
    const scene = cloneSceneWithDetachedMaterials(gltf.scene);
    tuneGridModelMaterials(scene, 'preview');
    const box = computeMeshBounds(scene);
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

const DEFAULT_MODEL_MOTION: ModelMotionProfile = {
  bobAmplitude: 0.028,
  bobSpeed: 2.4,
  pulseBase: 0.22,
  pulseBoost: 0.22,
  spinSpeed: 1.2,
  swayAmplitude: 0.04,
  swaySpeed: 1.1,
  tiltAmplitude: 0.045,
  tiltSpeed: 1.25
};

const MODEL_MOTION_BY_NODE_ID: Record<string, Partial<ModelMotionProfile>> = {
  'control-center': {
    pulseBase: 0.28,
    pulseBoost: 0.26,
    spinSpeed: 1.45,
    tiltAmplitude: 0.03
  },
  'smart-transformer': {
    pulseBase: 0.24,
    pulseBoost: 0.28,
    bobAmplitude: 0.02
  },
  'solar-forecasting-array': {
    bobAmplitude: 0.018,
    bobSpeed: 1.6,
    pulseBase: 0.2,
    pulseBoost: 0.18,
    swayAmplitude: 0.055,
    swaySpeed: 0.95,
    tiltAmplitude: 0.024
  },
  'battery-storage': {
    bobAmplitude: 0.016,
    pulseBase: 0.26,
    pulseBoost: 0.34,
    tiltAmplitude: 0.02
  },
  'frequency-controller': {
    bobAmplitude: 0.022,
    pulseBase: 0.22,
    pulseBoost: 0.24,
    spinSpeed: 1.8,
    tiltAmplitude: 0.03
  },
  'demand-response-system': {
    bobAmplitude: 0.02,
    pulseBase: 0.24,
    pulseBoost: 0.26,
    tiltAmplitude: 0.026
  },
  'grid-flywheel': {
    bobAmplitude: 0.024,
    pulseBase: 0.24,
    pulseBoost: 0.22,
    spinSpeed: 2.1,
    tiltAmplitude: 0.028
  },
  'hvdc-interconnector': {
    bobAmplitude: 0.014,
    bobSpeed: 1.35,
    pulseBase: 0.18,
    pulseBoost: 0.16,
    swayAmplitude: 0.02,
    tiltAmplitude: 0.016
  },
  'ai-grid-optimizer': {
    bobAmplitude: 0.024,
    pulseBase: 0.28,
    pulseBoost: 0.3,
    spinSpeed: 1.55,
    tiltAmplitude: 0.034
  }
};

const parseAnimatedAxis = (
  name: string,
  mode: 'spin' | 'sway'
): RotationAxis | null => {
  if (name.startsWith(`${mode}-x-`)) {
    return 'x';
  }

  if (name.startsWith(`${mode}-y-`)) {
    return 'y';
  }

  if (name.startsWith(`${mode}-z-`)) {
    return 'z';
  }

  return null;
};

const hashUnit = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33 + value.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
};

export function NodeActor({
  node,
  asset,
  position,
  qualityCaps,
  assetDescriptor,
  modelAvailable,
  renderModel,
  reducedMotion,
  focused,
  connected,
  highlighted,
  deploying,
  onHoverChange,
  onSelect
}: NodeActorProps) {
  const outerRingRef = useRef<Mesh>(null);
  const categoryRingRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);
  const modelWrapperRef = useRef<Group>(null);
  const animatedModelPartsRef = useRef<{
    pulses: AnimatedPulseMaterial[];
    rotations: AnimatedRotationPart[];
  }>({
    pulses: [],
    rotations: []
  });

  const visualCategory = node.visual_category ?? asset.category;
  const isBatteryNode = node.id === 'battery-storage';
  const iconColor = isBatteryNode ? GRID_VISUAL_TOKENS.accentAmber : CATEGORY_COLOR[visualCategory];
  const stateColor = STATE_COLOR[node.state];
  const assetDescriptorKey = assetDescriptor?.key ?? null;
  const modelMotion = useMemo<ModelMotionProfile>(
    () => ({
      ...DEFAULT_MODEL_MOTION,
      ...MODEL_MOTION_BY_NODE_ID[node.id]
    }),
    [node.id]
  );

  const baseRadius = useMemo(() => {
    if (node.importance === 'anchor') {
      return 0.52;
    }

    if (node.importance === 'primary') {
      return 0.47;
    }

    return 0.42;
  }, [node.importance]);

  // Use a camera-facing interaction plane so the visible projected area is easy to hover/click.
  const interactionHitArea = useMemo(() => {
    if (node.id === 'battery-storage') {
      return {
        width: 3.45,
        height: 3.05,
        y: 0.52
      };
    }

    if (assetDescriptor && modelAvailable && renderModel) {
      return {
        width: 1.95,
        height: 1.76,
        y: 0.44
      };
    }

    return {
      width: Math.max(1.5, (baseRadius + 0.42) * 2),
      height: 1.48,
      y: 0.34
    };
  }, [assetDescriptor, baseRadius, modelAvailable, node.id, renderModel]);

  const interactionScale = highlighted ? 1.14 : 1;
  const motionMultiplier = Math.max(1, qualityCaps.animationSpeedMultiplier);

  useEffect(() => {
    const nextParts: {
      pulses: AnimatedPulseMaterial[];
      rotations: AnimatedRotationPart[];
    } = {
      pulses: [],
      rotations: []
    };

    if (!assetDescriptorKey || !modelAvailable || !renderModel || !modelWrapperRef.current) {
      animatedModelPartsRef.current = nextParts;
      return;
    }

    modelWrapperRef.current.traverse((object) => {
      const spinAxis = parseAnimatedAxis(object.name ?? '', 'spin');
      if (spinAxis) {
        const direction = hashUnit(object.name) > 0.5 ? 1 : -1;
        nextParts.rotations.push({
          axis: spinAxis,
          baseRotation: object.rotation[spinAxis],
          direction,
          mode: 'spin',
          object,
          phase: hashUnit(`${object.name}:spin`) * Math.PI * 2
        });
      }

      const swayAxis = parseAnimatedAxis(object.name ?? '', 'sway');
      if (swayAxis) {
        nextParts.rotations.push({
          axis: swayAxis,
          baseRotation: object.rotation[swayAxis],
          direction: 1,
          mode: 'sway',
          object,
          phase: hashUnit(`${object.name}:sway`) * Math.PI * 2
        });
      }

      const mesh = object as Mesh;
      if (!mesh.isMesh || !mesh.name.startsWith('pulse-')) {
        return;
      }

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshStandardMaterial)) {
          return;
        }

        nextParts.pulses.push({
          material,
          phase: hashUnit(`${mesh.name}:pulse`) * Math.PI * 2,
          weight: 0.7 + hashUnit(`${mesh.name}:weight`) * 0.6
        });
      });
    });

    animatedModelPartsRef.current = nextParts;

    return () => {
      animatedModelPartsRef.current = {
        pulses: [],
        rotations: []
      };
    };
  }, [assetDescriptorKey, modelAvailable, renderModel]);

  useFrame((clock) => {
    const elapsed = clock.clock.getElapsedTime();

    if (outerRingRef.current) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(elapsed * 3.1 * motionMultiplier + position.x) * 0.065;
      const deployPulse = deploying ? 1.14 + Math.sin(elapsed * 12 * motionMultiplier) * 0.12 : 1;
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
      categoryRingRef.current.rotation.z = elapsed * velocity * motionMultiplier * 1.45;
    }

    if (coreRef.current && !reducedMotion) {
      const pulseBoost = 1 + Math.sin(elapsed * 9.5) * 0.14;
      const intensityBase = highlighted || deploying ? 0.6 : connected ? 0.4 : 0.2;
      const intensity = intensityBase * pulseBoost;
      coreRef.current.position.y = 0.08 + Math.sin(elapsed * 3.15 * motionMultiplier + position.z) * 0.028;
      if (coreRef.current.material instanceof MeshStandardMaterial) {
        coreRef.current.material.emissiveIntensity = intensity;
      }
    }

    if (modelWrapperRef.current) {
      animatedModelPartsRef.current.pulses.forEach((pulse) => {
        pulse.material.emissiveIntensity = 0.02;
      });
    }

    if (modelWrapperRef.current && !reducedMotion) {
      const bobbing =
        Math.sin(elapsed * modelMotion.bobSpeed * motionMultiplier + position.x) *
        modelMotion.bobAmplitude;
      const tilt =
        Math.sin(elapsed * modelMotion.tiltSpeed * motionMultiplier + position.z) *
        modelMotion.tiltAmplitude;
      const deployKick = deploying ? 0.025 : 0;
      modelWrapperRef.current.position.y = bobbing + deployKick;
      modelWrapperRef.current.rotation.y = tilt;

      animatedModelPartsRef.current.rotations.forEach((part) => {
        if (part.mode === 'spin') {
          part.object.rotation[part.axis] =
            part.baseRotation +
            elapsed * modelMotion.spinSpeed * motionMultiplier * part.direction +
            part.phase * 0.06;
          return;
        }

        part.object.rotation[part.axis] =
          part.baseRotation +
          Math.sin(elapsed * modelMotion.swaySpeed * motionMultiplier + part.phase) *
            modelMotion.swayAmplitude;
      });
    }
  });

  const dimmed = !focused && !highlighted;
  return (
    <group
      position={[position.x, 0.08, position.z]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect(node.id);
      }}
      scale={dimmed ? 0.93 : 1}
    >
      <Billboard follow position={[0, interactionHitArea.y, 0]}>
        <mesh
          onPointerOver={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onHoverChange(node.id);
          }}
          onPointerOut={(event: ThreeEvent<PointerEvent>) => {
            event.stopPropagation();
            onHoverChange(null);
          }}
          onClick={(event: ThreeEvent<MouseEvent>) => {
            event.stopPropagation();
            onSelect(node.id);
          }}
        >
          <planeGeometry
            args={[
              interactionHitArea.width * interactionScale,
              interactionHitArea.height * interactionScale
            ]}
          />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      </Billboard>

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
        <group ref={modelWrapperRef}>
          <ModelCore
            descriptor={assetDescriptor}
          />
        </group>
      ) : null}

      <Billboard follow position={[0, 0.23, 0]}>
        <Html center transform={false} occlude={false}>
          <span
            data-grid-node={node.id}
            data-node-state={node.state}
            data-node-category={visualCategory}
            className="pointer-events-none sr-only"
          />
        </Html>
      </Billboard>
    </group>
  );
}
