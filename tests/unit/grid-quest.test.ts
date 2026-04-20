import { describe, expect, it } from 'vitest';
import { computeQuestView } from '@/lib/grid/quest';
import { GRID_COMPONENTS, GRID_COMPONENTS_BY_SLUG, TOTAL_GRID_COST_KWH } from '@/lib/grid/components';

describe('computeQuestView', () => {
  it('returns blackout state at 0 deployed', () => {
    const q = computeQuestView([]);
    expect(q.stateId).toBe('briefing');
    expect(q.header).toMatch(/BLACKOUT/);
  });

  it('returns first-light at exactly 1 deployed', () => {
    const q = computeQuestView(['primary-substation']);
    expect(q.stateId).toBe('first-light');
  });

  it('returns backbone-energizing at 2-3 deployed', () => {
    expect(computeQuestView(['primary-substation', 'power-transformer']).stateId).toBe('backbone-energizing');
    expect(computeQuestView(['primary-substation', 'power-transformer', 'protective-relay']).stateId).toBe('backbone-energizing');
  });

  it('returns load-balancing at 4-6 deployed', () => {
    const items = ['primary-substation', 'power-transformer', 'protective-relay', 'circuit-breaker-bank'] as const;
    expect(computeQuestView([...items]).stateId).toBe('load-balancing');
  });

  it('returns renewables-online at 7-9 deployed', () => {
    const items = GRID_COMPONENTS.slice(0, 7).map((c) => c.slug);
    expect(computeQuestView(items).stateId).toBe('renewables-online');
  });

  it('returns restored at 10 deployed with no objective', () => {
    const items = GRID_COMPONENTS.map((c) => c.slug);
    const q = computeQuestView(items);
    expect(q.stateId).toBe('restored');
    expect(q.objective).toBeNull();
  });

  it('shows early-control-center nudge when control-center deployed first', () => {
    const q = computeQuestView(['control-center']);
    expect(q.flavorNudge).toMatch(/Dispatch online with nothing to dispatch/);
  });

  it('shows generation-without-protection nudge', () => {
    const q = computeQuestView(['solar-array', 'wind-turbine-cluster', 'primary-substation']);
    expect(q.flavorNudge).toMatch(/Generation without protection/);
  });

  it('shows no-storage nudge at 5+ without battery', () => {
    const items = ['primary-substation', 'power-transformer', 'protective-relay', 'circuit-breaker-bank', 'capacitor-bank'] as const;
    const q = computeQuestView([...items]);
    expect(q.flavorNudge).toMatch(/Consider storage/);
  });

  it('returns no nudge in the vanilla path', () => {
    const q = computeQuestView(['primary-substation', 'power-transformer']);
    expect(q.flavorNudge).toBeNull();
  });
});

describe('GRID_COMPONENTS seed data', () => {
  it('has exactly 10 components', () => {
    expect(GRID_COMPONENTS).toHaveLength(10);
  });

  it('has unique slugs', () => {
    const slugs = GRID_COMPONENTS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique districts', () => {
    const districts = GRID_COMPONENTS.map((c) => c.restoresDistrict);
    expect(new Set(districts).size).toBe(districts.length);
  });

  it('has displayOrder 1..10 with no gaps', () => {
    const orders = GRID_COMPONENTS.map((c) => c.displayOrder).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('total cost across all 10 components is a positive integer', () => {
    expect(TOTAL_GRID_COST_KWH).toBeGreaterThan(0);
    expect(Number.isInteger(TOTAL_GRID_COST_KWH)).toBe(true);
  });

  it('GRID_COMPONENTS_BY_SLUG returns the same component by slug', () => {
    for (const c of GRID_COMPONENTS) {
      expect(GRID_COMPONENTS_BY_SLUG[c.slug]).toEqual(c);
    }
  });

  it('only Generation components are gated', () => {
    const gated = GRID_COMPONENTS.filter((c) => c.gate === 'any-module-complete');
    expect(gated.map((c) => c.category)).toEqual(['generation', 'generation']);
  });
});
