'use client';

import { Clone, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Radar } from 'lucide-react';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Box3, Mesh, Sphere, type Group } from 'three';
import { cloneSceneWithDetachedMaterials } from '@/components/grid-ops/scene/cloneSceneWithDetachedMaterials';

const CONTROL_CENTER_MODEL_URL = '/grid-assets/models/control-center.glb?v=placeholder-v2';

function ControlCenterModelMesh() {
  const gltf = useGLTF(CONTROL_CENTER_MODEL_URL);
  const wrapperRef = useRef<Group>(null);

  const normalizedModel = useMemo(() => {
    const scene = cloneSceneWithDetachedMaterials(gltf.scene);
    const bounds = new Box3().setFromObject(scene);
    const sphere = new Sphere();
    bounds.getBoundingSphere(sphere);

    const targetRadius = 0.74;
    const scaleFactor = targetRadius / Math.max(0.001, sphere.radius);
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
      position: [
        -sphere.center.x * scaleFactor,
        -sphere.center.y * scaleFactor,
        -sphere.center.z * scaleFactor
      ] as [
        number,
        number,
        number
      ]
    };
  }, [gltf.scene]);

  useFrame((clock) => {
    if (!wrapperRef.current) {
      return;
    }

    wrapperRef.current.rotation.y = 0.25 + clock.clock.getElapsedTime() * 0.2;
  });

  return (
    <group ref={wrapperRef} position={[0, 0.02, 0]}>
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

export function ControlCenterModelPreview({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [canvasEventSource, setCanvasEventSource] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAvailability = async () => {
      try {
        const response = await fetch(CONTROL_CENTER_MODEL_URL, {
          method: 'HEAD',
          cache: 'no-store'
        });
        if (!cancelled) {
          setAvailable(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    };

    void checkAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setCanvasEventSource(containerRef.current);
  }, []);

  if (available === false) {
    return (
      <div
        className={`flex h-24 items-center justify-center gap-2 rounded-lg border border-[#2b4f41] bg-[#08120f] text-xs font-medium text-[#8ca89a] ${className ?? ''}`}
      >
        <Radar className="h-4 w-4 text-[#2AA9FF]" />
        Control Center model unavailable
      </div>
    );
  }

  if (available === null) {
    return (
      <div
        className={`h-24 animate-pulse rounded-lg border border-[#2b4f41] bg-[radial-gradient(circle_at_24%_16%,rgba(88,132,255,0.22),transparent_42%),#08120f] ${className ?? ''}`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`h-24 overflow-hidden rounded-lg border border-[#2b4f41] bg-[radial-gradient(circle_at_24%_18%,rgba(88,132,255,0.2),transparent_46%),linear-gradient(180deg,#0a1322,#060c15)] ${className ?? ''}`}
    >
      {canvasEventSource ? (
        <Canvas
          eventSource={canvasEventSource}
          shadows={false}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ position: [0, 0.2, 2.44], fov: 31, near: 0.1, far: 30 }}
        >
          <ambientLight intensity={0.58} color="#ffffff" />
          <directionalLight intensity={0.62} color="#ffffff" position={[3.2, 4.2, 2.2]} />
          <directionalLight intensity={0.34} color="#b8cdfc" position={[-3, 2.2, 0.2]} />
          <Suspense fallback={null}>
            <ControlCenterModelMesh />
          </Suspense>
        </Canvas>
      ) : null}
    </div>
  );
}
