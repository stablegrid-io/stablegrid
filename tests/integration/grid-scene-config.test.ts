import { describe, expect, it } from 'vitest';
import { resolveSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';

describe('grid scene config integration', () => {
  it('uses desktop caps by default at desktop viewport', () => {
    const caps = resolveSceneRuntimeCaps({
      viewportWidth: 1366,
      deviceMemory: 8,
      prefersReducedMotion: false
    });

    expect(caps.profile).toBe('desktop');
    expect(caps.dpr[1]).toBeGreaterThan(1.3);
    expect(caps.enableShadows).toBe(true);
  });

  it('uses mobile reduced caps when device is constrained', () => {
    const caps = resolveSceneRuntimeCaps({
      viewportWidth: 430,
      deviceMemory: 4,
      prefersReducedMotion: false
    });

    expect(caps.profile).toBe('mobileReduced');
    expect(caps.enableShadows).toBe(false);
    expect(caps.maxAnimatedEdges).toBeLessThan(10);
  });
});
