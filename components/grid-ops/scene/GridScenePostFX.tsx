import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { Vector2 } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { VignetteShader } from 'three/examples/jsm/shaders/VignetteShader.js';
import type { GridSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';

interface GridScenePostFXProps {
  caps: GridSceneRuntimeCaps;
}

export function GridScenePostFX({ caps }: GridScenePostFXProps) {
  if (!caps.enablePostFX) {
    return null;
  }

  return <GridScenePostFXEnabled caps={caps} />;
}

function GridScenePostFXEnabled({ caps }: GridScenePostFXProps) {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      caps.bloomIntensity,
      caps.bloomRadius,
      caps.bloomThreshold
    );
    const vignettePass = new ShaderPass(VignetteShader);
    vignettePass.uniforms.offset.value = 0.36;
    vignettePass.uniforms.darkness.value = 1.15;

    const effectComposer = new EffectComposer(gl);
    effectComposer.addPass(renderPass);
    effectComposer.addPass(bloomPass);
    effectComposer.addPass(vignettePass);
    return effectComposer;
  }, [camera, caps.bloomIntensity, caps.bloomRadius, caps.bloomThreshold, gl, scene, size.height, size.width]);

  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size.height, size.width]);

  useEffect(() => {
    return () => {
      composer.dispose();
    };
  }, [composer]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
