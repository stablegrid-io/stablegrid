import { Box3, type Object3D, type Mesh } from 'three';

export function computeMeshBounds(root: Object3D) {
  const bounds = new Box3();
  let hasMesh = false;

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) {
      return;
    }

    const meshBounds = new Box3().setFromObject(mesh);
    if (!hasMesh) {
      bounds.copy(meshBounds);
      hasMesh = true;
      return;
    }

    bounds.union(meshBounds);
  });

  if (!hasMesh) {
    bounds.setFromObject(root);
  }

  return bounds;
}
