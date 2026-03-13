'use client';

import { Clone, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { Mesh, Sphere, type Group } from 'three';
import { cloneSceneWithDetachedMaterials } from '@/components/grid-ops/scene/cloneSceneWithDetachedMaterials';
import { computeMeshBounds } from '@/components/grid-ops/scene/computeMeshBounds';
import { resolveSceneAssetDescriptor } from '@/lib/grid-ops/sceneAssets';
import { tuneGridModelMaterials } from '@/components/grid-ops/scene/tuneGridModelMaterials';

const BATTERY_MODEL_URL =
  resolveSceneAssetDescriptor('battery-storage')?.url ??
  '/grid-assets/models/high-poly-archive/battery-storage.glb?v=high-poly-v1';

function BatteryModelMesh() {
  const gltf = useGLTF(BATTERY_MODEL_URL);
  const wrapperRef = useRef<Group>(null);

  const normalizedModel = useMemo(() => {
    const scene = cloneSceneWithDetachedMaterials(gltf.scene);
    tuneGridModelMaterials(scene, 'preview');
    const bounds = computeMeshBounds(scene);
    const sphere = new Sphere();
    bounds.getBoundingSphere(sphere);

    const targetRadius = 0.68;
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

    wrapperRef.current.rotation.y = 0.4 + clock.clock.getElapsedTime() * 0.28;
  });

  return (
    <group ref={wrapperRef} position={[0, 0, 0]}>
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

export function BatteryStorageModelPreview({ className }: { className?: string }) {
  return (
    <div
      className={`h-24 overflow-hidden rounded-lg border border-white/8 bg-[radial-gradient(circle_at_30%_18%,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,#0c121a,#070b11)] ${className ?? ''}`}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.12, 2.24], fov: 30, near: 0.1, far: 30 }}
      >
        <ambientLight intensity={0.42} color="#f5f7fb" />
        <directionalLight intensity={0.52} color="#ffffff" position={[2.6, 3.8, 1.8]} />
        <directionalLight intensity={0.16} color="#dde4ef" position={[-2.8, 1.8, 0.2]} />
        <Suspense fallback={null}>
          <BatteryModelMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(BATTERY_MODEL_URL);
