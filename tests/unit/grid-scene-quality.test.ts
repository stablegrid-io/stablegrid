import { describe, expect, it } from 'vitest';
import {
  resolveSceneQualityProfile,
  resolveSceneRuntimeCaps
} from '@/lib/grid-ops/sceneQuality';

describe('grid scene quality profile', () => {
  it('selects desktop profile for wide viewport and normal motion', () => {
    const profile = resolveSceneQualityProfile({
      viewportWidth: 1440,
      deviceMemory: 8,
      prefersReducedMotion: false
    });

    expect(profile).toBe('desktop');
  });

  it('selects mobile reduced profile for narrow viewport', () => {
    const profile = resolveSceneQualityProfile({
      viewportWidth: 768,
      deviceMemory: 8,
      prefersReducedMotion: false
    });

    expect(profile).toBe('mobileReduced');
  });

  it('selects mobile reduced profile when reduced motion is enabled', () => {
    const profile = resolveSceneQualityProfile({
      viewportWidth: 1440,
      deviceMemory: 16,
      prefersReducedMotion: true
    });

    expect(profile).toBe('mobileReduced');
  });

  it('returns lower runtime caps for mobile reduced profile', () => {
    const desktop = resolveSceneRuntimeCaps({
      viewportWidth: 1440,
      deviceMemory: 8,
      prefersReducedMotion: false
    });

    const mobile = resolveSceneRuntimeCaps({
      viewportWidth: 780,
      deviceMemory: 4,
      prefersReducedMotion: false
    });

    expect(desktop.profile).toBe('desktop');
    expect(mobile.profile).toBe('mobileReduced');
    expect(desktop.maxAnimatedEdges).toBeGreaterThan(mobile.maxAnimatedEdges);
    expect(desktop.maxPulseParticles).toBeGreaterThan(mobile.maxPulseParticles);
    expect(desktop.enableShadows).toBe(true);
    expect(mobile.enableShadows).toBe(false);
  });
});
