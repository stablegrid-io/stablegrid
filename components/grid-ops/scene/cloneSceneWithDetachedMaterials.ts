import type { Object3D } from 'three';
import { Mesh } from 'three';

export function cloneSceneWithDetachedMaterials<T extends Object3D>(source: T): T {
  const scene = source.clone(true) as T;

  scene.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || !mesh.material) {
      return;
    }

    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone());
      return;
    }

    mesh.material = mesh.material.clone();
  });

  return scene;
}
