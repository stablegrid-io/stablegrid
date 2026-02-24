export type GridSceneQualityProfile = 'desktop' | 'mobileReduced';

export interface GridSceneRuntimeCaps {
  profile: GridSceneQualityProfile;
  dpr: [number, number];
  enablePostFX: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;
  enableShadows: boolean;
  maxModelRenders: number;
  maxAnimatedEdges: number;
  maxPulseParticles: number;
  animationSpeedMultiplier: number;
  flowOpacity: number;
}

const DESKTOP_CAPS: GridSceneRuntimeCaps = {
  profile: 'desktop',
  dpr: [1, 1.25],
  enablePostFX: true,
  bloomIntensity: 0.36,
  bloomThreshold: 0.38,
  bloomRadius: 0.26,
  enableShadows: false,
  maxModelRenders: 2,
  maxAnimatedEdges: 8,
  maxPulseParticles: 1,
  animationSpeedMultiplier: 0.84,
  flowOpacity: 0.82
};

const MOBILE_REDUCED_CAPS: GridSceneRuntimeCaps = {
  profile: 'mobileReduced',
  dpr: [0.9, 1.05],
  enablePostFX: false,
  bloomIntensity: 0,
  bloomThreshold: 1,
  bloomRadius: 0,
  enableShadows: false,
  maxModelRenders: 1,
  maxAnimatedEdges: 4,
  maxPulseParticles: 0,
  animationSpeedMultiplier: 0.62,
  flowOpacity: 0.72
};

const MOBILE_BREAKPOINT = 1280;
const LOW_MEMORY_THRESHOLD_GB = 8;

export const resolveSceneQualityProfile = ({
  viewportWidth,
  deviceMemory,
  prefersReducedMotion
}: {
  viewportWidth: number;
  deviceMemory?: number | null;
  prefersReducedMotion: boolean;
}): GridSceneQualityProfile => {
  if (prefersReducedMotion) {
    return 'mobileReduced';
  }

  if (viewportWidth < MOBILE_BREAKPOINT) {
    return 'mobileReduced';
  }

  if (typeof deviceMemory === 'number' && deviceMemory > 0 && deviceMemory <= LOW_MEMORY_THRESHOLD_GB) {
    return 'mobileReduced';
  }

  return 'desktop';
};

export const resolveSceneRuntimeCaps = ({
  viewportWidth,
  deviceMemory,
  prefersReducedMotion
}: {
  viewportWidth: number;
  deviceMemory?: number | null;
  prefersReducedMotion: boolean;
}): GridSceneRuntimeCaps => {
  const profile = resolveSceneQualityProfile({
    viewportWidth,
    deviceMemory,
    prefersReducedMotion
  });

  return profile === 'desktop' ? DESKTOP_CAPS : MOBILE_REDUCED_CAPS;
};
