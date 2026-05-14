import { describe, expect, it } from 'vitest';
import {
  getCanonicalModuleContext,
  inferTrackSlugFromModuleId
} from '@/lib/learn/canonicalModules';

describe('inferTrackSlugFromModuleId', () => {
  it('maps PS* to junior', () => {
    expect(inferTrackSlugFromModuleId('module-PS1')).toBe('junior');
    expect(inferTrackSlugFromModuleId('module-PS10')).toBe('junior');
  });

  it('maps PSI* to mid', () => {
    expect(inferTrackSlugFromModuleId('module-PSI1')).toBe('mid');
    expect(inferTrackSlugFromModuleId('module-PSI10')).toBe('mid');
  });

  it('maps PSS* to senior', () => {
    expect(inferTrackSlugFromModuleId('module-PSS1')).toBe('senior');
    expect(inferTrackSlugFromModuleId('module-PSS10')).toBe('senior');
  });

  it('returns null for unknown shapes', () => {
    expect(inferTrackSlugFromModuleId('module-FND-XYZ')).toBeNull();
    expect(inferTrackSlugFromModuleId('module-something')).toBeNull();
    expect(inferTrackSlugFromModuleId('')).toBeNull();
  });

  it('returns null but does not throw on PSX (no match) — regression check', () => {
    expect(inferTrackSlugFromModuleId('module-PSX1')).toBeNull();
  });
});

describe('getCanonicalModuleContext', () => {
  it('returns the pyspark module chain without a track filter', () => {
    const ctx = getCanonicalModuleContext('pyspark', null);
    expect(ctx.length).toBeGreaterThan(0);
    // Each entry has the canonical shape.
    for (const entry of ctx) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.order).toBe('number');
      expect(Array.isArray(entry.lessonIds)).toBe(true);
      expect(entry.sectionsTotal).toBe(entry.lessonIds.length);
    }
    // Ordered ascending by `order`.
    for (let i = 1; i < ctx.length; i += 1) {
      expect(ctx[i].order).toBeGreaterThanOrEqual(ctx[i - 1].order);
    }
  });

  it('filters by track slug when supplied', () => {
    const junior = getCanonicalModuleContext('pyspark', 'junior');
    const mid = getCanonicalModuleContext('pyspark', 'mid');
    expect(junior.length).toBeGreaterThan(0);
    expect(mid.length).toBeGreaterThan(0);
    // Junior modules use PS-prefix, mid modules use PSI-prefix — no overlap.
    const juniorIds = new Set(junior.map((m) => m.id));
    expect(mid.every((m) => !juniorIds.has(m.id))).toBe(true);
  });

  it('returns [] for an unknown topic', () => {
    expect(getCanonicalModuleContext('unknown', null)).toEqual([]);
  });
});
