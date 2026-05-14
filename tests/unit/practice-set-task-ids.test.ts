import { describe, expect, it } from 'vitest';
import { getPracticeSetTaskIds } from '@/lib/practice/practiceSetTaskIds';

describe('getPracticeSetTaskIds', () => {
  it('returns an ordered task id list for a valid pyspark module', () => {
    const ids = getPracticeSetTaskIds('pyspark', 'module-PS1');
    expect(ids.length).toBeGreaterThan(0);
    // Every id is a non-empty string
    for (const id of ids) {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    }
    // No duplicates
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('accepts both canonical and legacy module id forms', () => {
    const canonical = getPracticeSetTaskIds('pyspark', 'module-PS1');
    const legacy = getPracticeSetTaskIds('pyspark', 'PS1');
    expect(legacy).toEqual(canonical);
  });

  it('is case insensitive on the module prefix lookup', () => {
    const lower = getPracticeSetTaskIds('pyspark', 'module-ps1');
    const upper = getPracticeSetTaskIds('pyspark', 'module-PS1');
    expect(lower).toEqual(upper);
  });

  it('returns [] for unknown topic/module pairs', () => {
    expect(getPracticeSetTaskIds('pyspark', 'module-NOPE99')).toEqual([]);
    expect(getPracticeSetTaskIds('unknown-topic', 'module-PS1')).toEqual([]);
  });

  it('covers all three tier prefixes (PS, PSI, PSS / PM, PX in legacy)', () => {
    // Junior
    expect(getPracticeSetTaskIds('pyspark', 'module-PS1').length).toBeGreaterThan(0);
    // Mid
    expect(getPracticeSetTaskIds('pyspark', 'module-PM1').length).toBeGreaterThan(0);
    // Senior
    expect(getPracticeSetTaskIds('pyspark', 'module-PX1').length).toBeGreaterThan(0);
  });
});
