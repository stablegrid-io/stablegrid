'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { GRID_SCENE_ASSET_REGISTRY, GRID_SCENE_MODEL_URLS, resolveSceneAssetDescriptor } from '@/lib/grid-ops/sceneAssets';
import { resolveSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';
import type { GridOpsAssetView, GridOpsComputedState } from '@/lib/grid-ops/types';
import {
  GRID_MAP_DIMENSIONS,
  resolveNodeMapLayout,
  toSceneCoordinates
} from '@/lib/grid-ops/visualConfig';
import { EdgeActor } from '@/components/grid-ops/scene/EdgeActor';
import { GridGround } from '@/components/grid-ops/scene/GridGround';
import { NodeActor } from '@/components/grid-ops/scene/NodeActor';
import { GridScenePostFX } from '@/components/grid-ops/scene/GridScenePostFX';

let modelAvailabilityPromise: Promise<Record<string, boolean>> | null = null;
const cachedAvailableModelUrls = new Set<string>();

const loadModelAvailabilityByUrl = async () => {
  if (modelAvailabilityPromise) {
    return modelAvailabilityPromise;
  }

  modelAvailabilityPromise = Promise.all(
    GRID_SCENE_MODEL_URLS.map(async (url) => {
      if (cachedAvailableModelUrls.has(url)) {
        return [url, true] as const;
      }

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (response.ok) {
          cachedAvailableModelUrls.add(url);
        }
        return [url, response.ok] as const;
      } catch {
        return [url, false] as const;
      }
    })
  )
    .then((checks) => Object.fromEntries(checks))
    .finally(() => {
      modelAvailabilityPromise = null;
    });

  return modelAvailabilityPromise;
};

interface GridSceneCanvasProps {
  state: GridOpsComputedState;
  highlightedAssetId: string | null;
  deployingAssetId: string | null;
  className?: string;
}

const intersects = (
  left: { x1: number; y1: number; x2: number; y2: number },
  right: { x1: number; y1: number; x2: number; y2: number }
) => left.x1 < right.x2 && left.x2 > right.x1 && left.y1 < right.y2 && left.y2 > right.y1;

const shortLabel = (asset: GridOpsAssetView) => {
  const clean = asset.name
    .replace(/\(.*?\)/g, '')
    .replace(/\bSystem\b/gi, '')
    .replace(/\bArray\b/gi, '')
    .trim();

  return clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join(' ');
};

interface CameraPose {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}

const resolveCameraPose = (width: number): CameraPose => {
  if (width < 860) {
    return {
      position: [0, 10.9, 14.2],
      lookAt: [0, 0, 0],
      fov: 42
    };
  }

  if (width < 1200) {
    return {
      position: [0, 9.4, 12.2],
      lookAt: [0, 0, 0],
      fov: 38
    };
  }

  return {
    position: [0, 8.6, 10.8],
    lookAt: [0, 0, 0],
    fov: 35
  };
};

function OrbitCameraRig({ pose }: { pose: CameraPose }) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...pose.position);
    camera.lookAt(...pose.lookAt);

    if ('fov' in camera) {
      const perspective = camera as typeof camera & {
        fov: number;
        updateProjectionMatrix: () => void;
      };
      perspective.fov = pose.fov;
      perspective.updateProjectionMatrix();
    }
  }, [camera, pose]);

  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.58}
      zoomSpeed={0.9}
      minDistance={6.4}
      maxDistance={24}
      minPolarAngle={0.25}
      maxPolarAngle={1.46}
      target={pose.lookAt}
    />
  );
}

function DevFpsSampler() {
  const [fps, setFps] = useState(0);
  const framesRef = useRef(0);
  const lastSampleRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    let rafId = 0;
    const tick = () => {
      framesRef.current += 1;
      const now = performance.now();
      const elapsed = now - lastSampleRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((framesRef.current * 1000) / elapsed));
        framesRef.current = 0;
        lastSampleRef.current = now;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-md border border-[#2e5448] bg-[#081510]/88 px-2 py-1 text-[11px] text-[#91beab]">
      {fps} FPS
    </div>
  );
}

export function GridSceneCanvas({
  state,
  highlightedAssetId,
  deployingAssetId,
  className
}: GridSceneCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1320);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [deviceMemory, setDeviceMemory] = useState<number | null>(null);
  const [modelAvailabilityByNodeId, setModelAvailabilityByNodeId] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(media.matches);
    onChange();

    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewportWidth(entry.contentRect.width);
    });

    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      setDeviceMemory(null);
      return;
    }

    const nav = navigator as Navigator & { deviceMemory?: number };
    setDeviceMemory(typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      const availabilityByUrl = await loadModelAvailabilityByUrl();

      if (cancelled) {
        return;
      }

      const availabilityByNode = Object.keys(GRID_SCENE_ASSET_REGISTRY).reduce<Record<string, boolean>>(
        (result, assetId) => {
          const descriptor = resolveSceneAssetDescriptor(assetId);
          if (!descriptor) {
            result[assetId] = false;
            return result;
          }

          const available = Boolean(availabilityByUrl[descriptor.url]);
          result[assetId] = available;

          if (available) {
            useGLTF.preload(descriptor.url);
          }

          return result;
        },
        {}
      );

      setModelAvailabilityByNodeId(availabilityByNode);
    };

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  const qualityCaps = useMemo(
    () =>
      resolveSceneRuntimeCaps({
        viewportWidth,
        deviceMemory,
        prefersReducedMotion: reducedMotion
      }),
    [deviceMemory, reducedMotion, viewportWidth]
  );

  const cameraPose = useMemo(() => resolveCameraPose(viewportWidth), [viewportWidth]);

  const detailLevel: 0 | 1 | 2 = viewportWidth < 900 ? 0 : viewportWidth < 1220 ? 1 : 2;

  const nodeById = useMemo(
    () => new Map(state.map.nodes.map((node) => [node.id, node])),
    [state.map.nodes]
  );

  const assetById = useMemo(
    () => new Map(state.assets.map((asset) => [asset.id, asset])),
    [state.assets]
  );

  const mapLayout = useMemo(
    () => resolveNodeMapLayout(state.map.nodes.map((node) => node.id)),
    [state.map.nodes]
  );

  const sceneLayout = useMemo(
    () =>
      Object.entries(mapLayout).reduce<Record<string, { x: number; y: number; z: number }>>(
        (result, [nodeId, mapPosition]) => {
          result[nodeId] = toSceneCoordinates({ mapX: mapPosition.x, mapY: mapPosition.y });
          return result;
        },
        {}
      ),
    [mapLayout]
  );

  const recommendedAssetId = state.recommendation.next_best_action.target_asset_id;
  const focusNodeId = hoveredNodeId ?? highlightedAssetId;
  const animatedEdgeIds = useMemo(() => {
    const activeIds = state.map.edges
      .filter((edge) => edge.energized)
      .slice(0, qualityCaps.maxAnimatedEdges)
      .map((edge) => edge.id);

    return new Set(activeIds);
  }, [qualityCaps.maxAnimatedEdges, state.map.edges]);

  const pulseEdgeIds = useMemo(() => {
    const activeIds = state.map.edges
      .filter((edge) => edge.energized)
      .slice(0, qualityCaps.maxPulseParticles)
      .map((edge) => edge.id);

    return new Set(activeIds);
  }, [qualityCaps.maxPulseParticles, state.map.edges]);

  const connectedNodeIds = useMemo(() => {
    if (!focusNodeId) {
      return new Set<string>();
    }

    const set = new Set<string>([focusNodeId]);
    state.map.edges.forEach((edge) => {
      if (edge.from === focusNodeId) {
        set.add(edge.to);
      }
      if (edge.to === focusNodeId) {
        set.add(edge.from);
      }
    });

    return set;
  }, [focusNodeId, state.map.edges]);

  const modelRenderNodeIds = useMemo(() => {
    if (qualityCaps.maxModelRenders <= 0) {
      return new Set<string>();
    }

    const candidates = state.map.nodes.filter((node) => {
      const hasDescriptor = Boolean(resolveSceneAssetDescriptor(node.id));
      const modelAvailability = modelAvailabilityByNodeId[node.id];
      const modelKnownUnavailable = modelAvailability === false;

      if (!hasDescriptor || modelKnownUnavailable) {
        return false;
      }

      const asset = assetById.get(node.id);
      if (!asset) {
        return false;
      }

      // "Unlocked" includes assets with prerequisites met but temporary kWh shortfall.
      const unlockedByProgress =
        asset.status !== 'locked' || asset.locked_reason?.startsWith('Need ') === true;

      return unlockedByProgress;
    });

    const scored = candidates
      .map((node) => {
        const asset = assetById.get(node.id);
        let score = 0;

        if (deployingAssetId === node.id) score += 120;
        if (focusNodeId === node.id) score += 90;
        if (recommendedAssetId === node.id) score += 60;
        if (node.isDeployed) score += 35;
        if (asset?.status === 'available') score += 10;

        return {
          nodeId: node.id,
          score
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, qualityCaps.maxModelRenders)
      .map((entry) => entry.nodeId);

    return new Set(scored);
  }, [
    assetById,
    deployingAssetId,
    focusNodeId,
    modelAvailabilityByNodeId,
    qualityCaps.maxModelRenders,
    recommendedAssetId,
    state.map.nodes
  ]);

  const labelVisibility = useMemo(() => {
    if (detailLevel === 0) {
      return new Set<string>();
    }

    const occupied: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const visible = new Set<string>();

    const ordered = [...state.map.nodes].sort((left, right) => {
      const leftAsset = assetById.get(left.id);
      const rightAsset = assetById.get(right.id);

      const leftScore =
        (leftAsset?.status === 'deployed' ? 3 : leftAsset?.status === 'available' ? 2 : 1) +
        (left.id === focusNodeId ? 2 : 0);
      const rightScore =
        (rightAsset?.status === 'deployed' ? 3 : rightAsset?.status === 'available' ? 2 : 1) +
        (right.id === focusNodeId ? 2 : 0);

      return rightScore - leftScore;
    });

    ordered.forEach((node) => {
      const asset = assetById.get(node.id);
      if (!asset) {
        return;
      }

      if (
        detailLevel === 1 &&
        node.id !== focusNodeId &&
        node.id !== recommendedAssetId &&
        asset.status !== 'deployed'
      ) {
        return;
      }

      const point = mapLayout[node.id] ?? node.position;
      const label = shortLabel(asset);
      const width = Math.max(80, Math.min(156, label.length * 6.3 + 20));
      const height = 20;

      const box = {
        x1: point.x - width / 2,
        y1: point.y + 34,
        x2: point.x + width / 2,
        y2: point.y + 34 + height
      };

      if (
        box.x1 < GRID_MAP_DIMENSIONS.safePadding ||
        box.x2 > GRID_MAP_DIMENSIONS.width - GRID_MAP_DIMENSIONS.safePadding ||
        box.y2 > GRID_MAP_DIMENSIONS.height - 12
      ) {
        return;
      }

      const collides = occupied.some((other) => intersects(other, box));
      if (!collides || node.id === focusNodeId) {
        occupied.push(box);
        visible.add(node.id);
      }
    });

    return visible;
  }, [assetById, detailLevel, focusNodeId, mapLayout, recommendedAssetId, state.map.nodes]);

  const hoveredNode = hoveredNodeId ? nodeById.get(hoveredNodeId) ?? null : null;
  const hoveredAsset = hoveredNodeId ? assetById.get(hoveredNodeId) ?? null : null;

  const activationRatio =
    state.map.regions.length > 0
      ? state.map.regions.filter((region) => region.active).length / state.map.regions.length
      : 0;

  return (
    <section
      ref={frameRef}
      data-grid-scene="2p5d"
      className={`relative h-[58vh] min-h-[520px] max-h-[760px] w-full overflow-hidden rounded-2xl border border-[#214236] bg-[radial-gradient(circle_at_18%_20%,rgba(0,208,132,0.18),transparent_40%),radial-gradient(circle_at_80%_76%,rgba(42,169,255,0.12),transparent_44%),linear-gradient(180deg,#071a14,#05110d)] ${className ?? ''}`}
    >
      <Canvas
        shadows={qualityCaps.enableShadows}
        dpr={qualityCaps.dpr}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.18;
        }}
        camera={{
          fov: cameraPose.fov,
          near: 0.1,
          far: 90,
          position: cameraPose.position
        }}
      >
        <OrbitCameraRig pose={cameraPose} />

        <ambientLight intensity={0.62} color="#ffffff" />
        <hemisphereLight intensity={0.48} color="#f6f8ff" groundColor="#263126" />
        <directionalLight
          castShadow={qualityCaps.enableShadows}
          intensity={1.04}
          color="#ffffff"
          position={[7.8, 12, 3.4]}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight intensity={0.42} color="#c9d6ff" position={[-5.8, 4.4, -3.2]} />
        <pointLight intensity={0.14} color="#7fd0ff" position={[4.6, 2.4, -1.8]} />
        <pointLight intensity={0.1} color="#74e4b6" position={[-6.2, 1.4, 1.2]} />

        <GridGround activationRatio={activationRatio} />
        <GridScenePostFX caps={qualityCaps} />

        {state.map.edges.map((edge) => {
          const from = sceneLayout[edge.from];
          const to = sceneLayout[edge.to];
          if (!from || !to) {
            return null;
          }

          const isConnectedToFocus =
            !focusNodeId || edge.from === focusNodeId || edge.to === focusNodeId;

          return (
            <EdgeActor
              key={edge.id}
              edge={edge}
              from={from}
              to={to}
              risk={state.simulation.blackout_risk_pct}
              focused={isConnectedToFocus}
              highlighted={isConnectedToFocus && Boolean(focusNodeId)}
              deploying={Boolean(deployingAssetId && (edge.from === deployingAssetId || edge.to === deployingAssetId))}
              reducedMotion={reducedMotion}
              animate={animatedEdgeIds.has(edge.id)}
              pulseEnabled={pulseEdgeIds.has(edge.id)}
              qualityCaps={qualityCaps}
            />
          );
        })}

        <Suspense fallback={null}>
          {state.map.nodes.map((node) => {
            const asset = assetById.get(node.id);
            const scenePosition = sceneLayout[node.id];
            const sceneAsset = resolveSceneAssetDescriptor(node.id);

            if (!asset || !scenePosition) {
              return null;
            }

            const focused = !focusNodeId || connectedNodeIds.has(node.id);

            return (
              <NodeActor
                key={node.id}
                node={node}
                asset={asset}
                position={scenePosition}
                showLabel={labelVisibility.has(node.id)}
                showMicro={detailLevel > 1 && (focused || node.id === hoveredNodeId)}
                qualityCaps={qualityCaps}
                assetDescriptor={sceneAsset}
                modelAvailable={modelAvailabilityByNodeId[node.id] !== false}
                renderModel={modelRenderNodeIds.has(node.id)}
                reducedMotion={reducedMotion}
                focused={focused}
                connected={connectedNodeIds.has(node.id)}
                highlighted={focusNodeId === node.id}
                deploying={deployingAssetId === node.id}
                recommended={recommendedAssetId === node.id}
                onHoverChange={setHoveredNodeId}
              />
            );
          })}
        </Suspense>
      </Canvas>

      {hoveredNode && hoveredAsset ? (
        <div className="pointer-events-none absolute left-4 top-4 z-20 w-[280px] rounded-xl border border-emerald-500/35 bg-[#0c1713]/94 p-3 text-[#ddf0e6] shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#90c4b0]">
            {hoveredNode.visual_category ?? hoveredAsset.category}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#ecf9f2]">{hoveredAsset.name}</p>
          <p className="mt-1 text-[12px] text-[#bfd6ca]">{hoveredAsset.description}</p>
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
            <span className="rounded border border-emerald-500/20 bg-black/25 px-2 py-1">+{hoveredAsset.effects.stability}% stability</span>
            <span className="rounded border border-emerald-500/20 bg-black/25 px-2 py-1">+{hoveredAsset.effects.riskMitigation} risk damp</span>
            <span className="rounded border border-emerald-500/20 bg-black/25 px-2 py-1">+{hoveredAsset.effects.forecast}% forecast</span>
            <span className="rounded border border-emerald-500/20 bg-black/25 px-2 py-1">{hoveredAsset.cost_kwh.toFixed(2)} kWh</span>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 inline-flex items-center gap-3 rounded-full border border-[#2b5245] bg-[#0a1813]/92 px-3 py-1.5 text-xs text-[#c8ded3]">
        <span className="inline-flex items-center gap-1">
          <span className="h-[2px] w-4 rounded bg-[#33e4bf]" />
          Active
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-[2px] w-4 rounded bg-[#f3bc55]" />
          Stressed
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-[2px] w-4 rounded bg-[#ff5f61]" />
          Faulted
        </span>
      </div>

      <div className="sr-only" aria-hidden>
        {state.map.nodes.map((node) => (
          <span
            key={node.id}
            data-grid-node-id={node.id}
            data-grid-node-state={node.state}
            data-grid-node-category={node.visual_category ?? node.category}
          />
        ))}
      </div>

      <div className="sr-only">
        {state.map.nodes.map((node) => (
          <button
            key={`focus-${node.id}`}
            type="button"
            onFocus={() => setHoveredNodeId(node.id)}
            onBlur={() => setHoveredNodeId(null)}
            onClick={() => setHoveredNodeId(node.id)}
          >
            Focus {node.name}
          </button>
        ))}
      </div>

      <DevFpsSampler />
    </section>
  );
}
