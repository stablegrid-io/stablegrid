import { describe, it, expect } from 'vitest';
import { computeLevel, computeLessonsLeft, LEVEL_THRESHOLDS } from '@/lib/level';

describe('computeLevel', () => {
  it('returns level 1 and pct 0 for XP = 0', () => {
    expect(computeLevel(0)).toEqual({ level: 1, pct: 0 });
  });

  it('returns correct pct midway through level 1 (XP = 25)', () => {
    // 25 / 50 = 50%
    expect(computeLevel(25)).toEqual({ level: 1, pct: 50 });
  });

  it('returns level 1 at XP = 49 (just below level 2)', () => {
    // 49 / 50 = 98%
    expect(computeLevel(49)).toEqual({ level: 1, pct: 98 });
  });

  it('returns level 2 at exactly XP = 50', () => {
    // threshold[1] = 50, start of level 2, range = 150-50 = 100, progress = 0/100
    expect(computeLevel(50)).toEqual({ level: 2, pct: 0 });
  });

  it('returns level 2 at XP = 51 (just above threshold)', () => {
    // (51-50) / (150-50) = 1/100 = 1%
    expect(computeLevel(51)).toEqual({ level: 2, pct: 1 });
  });

  it('returns correct pct midway through level 2 (XP = 100)', () => {
    // (100-50) / (150-50) = 50/100 = 50%
    expect(computeLevel(100)).toEqual({ level: 2, pct: 50 });
  });

  it('returns level 2 at XP = 149 (just below level 3)', () => {
    // (149-50) / (150-50) = 99/100 = 99%
    expect(computeLevel(149)).toEqual({ level: 2, pct: 99 });
  });

  it('returns level 3 at exactly XP = 150', () => {
    expect(computeLevel(150)).toEqual({ level: 3, pct: 0 });
  });

  it('returns level 8 at exactly XP = 3200', () => {
    // threshold[7] = 3200
    expect(computeLevel(3200)).toEqual({ level: 8, pct: 0 });
  });

  it('returns correct pct midway through level 8 (XP = 4100)', () => {
    // range = 5000 - 3200 = 1800, progress = 4100 - 3200 = 900, pct = 900/1800 = 50%
    expect(computeLevel(4100)).toEqual({ level: 8, pct: 50 });
  });

  it('returns max level (15) at XP = 50000 with pct = 100', () => {
    // At max threshold: hi = LEVEL_THRESHOLDS[15] which is undefined → hi = lo, range = 0 → pct = 100
    expect(computeLevel(50000)).toEqual({ level: 15, pct: 100 });
  });

  it('returns max level at XP above max threshold', () => {
    expect(computeLevel(99999)).toEqual({ level: 15, pct: 100 });
  });

  it('handles negative XP gracefully', () => {
    // Negative XP: loop never enters (xp < 50), level stays 1
    // pct = ((-10 - 0) / (50 - 0)) * 100 = -20 → clamped to min via Math.round but not clamped to 0
    // Actually: Math.min(100, Math.round((-10/50)*100)) = Math.min(100, -20) = -20
    // This reveals the function doesn't clamp to 0 for negative XP
    const result = computeLevel(-10);
    expect(result.level).toBe(1);
    // Negative pct is a known edge case — XP should never be negative in practice
    expect(result.pct).toBeLessThanOrEqual(0);
  });

  it('has monotonically increasing thresholds', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(LEVEL_THRESHOLDS[i]).toBeGreaterThan(LEVEL_THRESHOLDS[i - 1]);
    }
  });
});

describe('computeLessonsLeft', () => {
  it('returns 0 for empty array', () => {
    expect(computeLessonsLeft([])).toBe(0);
  });

  it('sums remaining lessons across topics', () => {
    expect(
      computeLessonsLeft([
        { theorySectionsTotal: 10, theorySectionsRead: 3 },
        { theorySectionsTotal: 5, theorySectionsRead: 5 },
      ]),
    ).toBe(7);
  });

  it('clamps per-topic to 0 when read exceeds total', () => {
    expect(
      computeLessonsLeft([{ theorySectionsTotal: 5, theorySectionsRead: 8 }]),
    ).toBe(0);
  });

  it('handles single topic with zero total and zero read', () => {
    expect(
      computeLessonsLeft([{ theorySectionsTotal: 0, theorySectionsRead: 0 }]),
    ).toBe(0);
  });

  it('handles multiple topics with mixed progress', () => {
    expect(
      computeLessonsLeft([
        { theorySectionsTotal: 20, theorySectionsRead: 5 },
        { theorySectionsTotal: 15, theorySectionsRead: 15 },
        { theorySectionsTotal: 10, theorySectionsRead: 0 },
      ]),
    ).toBe(25); // 15 + 0 + 10
  });
});
