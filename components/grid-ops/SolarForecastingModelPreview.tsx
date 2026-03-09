'use client';

import { Clone, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { Mesh, Sphere, type Group } from 'three';
import { cloneSceneWithDetachedMaterials } from '@/components/grid-ops/scene/cloneSceneWithDetachedMaterials';
import { computeMeshBounds } from '@/components/grid-ops/scene/computeMeshBounds';
import { resolveSceneAssetDescriptor } from '@/lib/grid-ops/sceneAssets';
import { tuneGridModelMaterials } from '@/components/grid-ops/scene/tuneGridModelMaterials';

const SOLAR_MODEL_URL =
  resolveSceneAssetDescriptor('solar-forecasting-array')?.url ??
  '/grid-assets/models/high-poly-archive/solar-forecasting-array.glb?v=high-poly-v1';

function SolarModelMesh() {
  const gltf = useGLTF(SOLAR_MODEL_URL);
  const wrapperRef = useRef<Group>(null);

  const normalizedModel = useMemo(() => {
    const scene = cloneSceneWithDetachedMaterials(gltf.scene);
    tuneGridModelMaterials(scene, 'preview');
    const bounds = computeMeshBounds(scene);
    const sphere = new Sphere();
    bounds.getBoundingSphere(sphere);

    const targetRadius = 0.78;
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

    wrapperRef.current.rotation.y = 0.18 + clock.clock.getElapsedTime() * 0.22;
    wrapperRef.current.rotation.x = -0.08;
  });

  return (
    <group ref={wrapperRef} position={[0, -0.04, 0]}>
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

export function SolarForecastingModelPreview({ className }: { className?: string }) {
  return (
    <div
      className={`h-24 overflow-hidden rounded-lg border border-[#2b4f41] bg-[radial-gradient(circle_at_24%_18%,rgba(88,132,255,0.2),transparent_46%),linear-gradient(180deg,#0a1322,#060c15)] ${className ?? ''}`}
    >
      <Canvas
        shadows={false}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0.3, 2.55], fov: 32, near: 0.1, far: 30 }}
      >
        <ambientLight intensity={0.58} color="#ffffff" />
        <directionalLight intensity={0.62} color="#ffffff" position={[3.2, 4.2, 2.2]} />
        <directionalLight intensity={0.34} color="#b8cdfc" position={[-3, 2.2, 0.2]} />
        <Suspense fallback={null}>
          <SolarModelMesh />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(SOLAR_MODEL_URL);
