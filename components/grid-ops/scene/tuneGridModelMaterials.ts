import { Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from 'three';

const PREVIEW_EMISSIVE_COLOR = new Color('#2aa9ff');
const SCENE_EMISSIVE_COLOR = new Color('#22b999');

const tuneStandardMaterial = (
  material: MeshStandardMaterial,
  profile: 'preview' | 'scene'
) => {
  const isPreview = profile === 'preview';
  const brightnessBoost = isPreview ? 1.42 : 1.16;
  const emissiveBlend = isPreview ? 0.2 : 0.12;
  const emissiveFloor = isPreview ? 0.48 : 0.24;
  const roughnessCap = isPreview ? 0.68 : 0.74;
  const metalnessCap = 0.34;

  material.color.multiplyScalar(brightnessBoost);
  material.emissive.lerp(
    isPreview ? PREVIEW_EMISSIVE_COLOR : SCENE_EMISSIVE_COLOR,
    emissiveBlend
  );
  material.emissiveIntensity = Math.max(material.emissiveIntensity, emissiveFloor);
  material.roughness = Math.min(material.roughness, roughnessCap);
  material.metalness = Math.min(material.metalness, metalnessCap);
  material.needsUpdate = true;
};

const tuneMaterial = (material: Material, profile: 'preview' | 'scene') => {
  if (material instanceof MeshStandardMaterial) {
    tuneStandardMaterial(material, profile);
  }
};

export const tuneGridModelMaterials = (
  root: Object3D,
  profile: 'preview' | 'scene'
) => {
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || !mesh.material) {
      return;
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => tuneMaterial(material, profile));
      return;
    }

    tuneMaterial(mesh.material, profile);
  });
};
