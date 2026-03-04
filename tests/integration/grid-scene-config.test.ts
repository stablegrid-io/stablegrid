import { describe, expect, it } from 'vitest';
import { resolveSceneRuntimeCaps } from '@/lib/grid-ops/sceneQuality';

describe('grid scene config integration', () => {
  it('uses desktop caps on wide higher-memory devices', () => {
    const caps = resolveSceneRuntimeCaps({
      viewportWidth: 1366,
      deviceMemory: 16,
      prefersReducedMotion: false
    });

    expect(caps.profile).toBe('desktop');
    expect(caps.dpr).toEqual([1, 1.25]);
    expect(caps.enableShadows).toBe(false);
    expect(caps.maxModelRenders).toBe(2);
  });

  it('uses mobile reduced caps when device is constrained', () => {
    const caps = resolveSceneRuntimeCaps({
      viewportWidth: 430,
      deviceMemory: 4,
      prefersReducedMotion: false
    });

    expect(caps.profile).toBe('mobileReduced');
    expect(caps.enableShadows).toBe(false);
    expect(caps.maxAnimatedEdges).toBe(10);
    expect(caps.maxModelRenders).toBe(1);
  });
});
