import { describe, expect, it } from 'vitest';
import {
  ENERGY_UNITS_PER_KWH,
  formatKwh,
  getChapterCompletionRewardUnits,
  getEnergyTier,
  getMissionRewardKwh,
  getMissionRewardUnits,
  getNextEnergyTier,
  getTierProgressPct,
  getHoursPowered,
  kwhToUnits,
  unitsToKwh
} from '@/lib/energy';

describe('energy conversion', () => {
  it('converts kWh to units and back consistently', () => {
    const kwh = 1.75;
    const units = kwhToUnits(kwh);
    expect(units).toBe(1750);
    expect(unitsToKwh(units)).toBe(kwh);
  });

  it('uses 1000 units per kWh', () => {
    expect(ENERGY_UNITS_PER_KWH).toBe(1000);
  });

  it('formats kWh output', () => {
    expect(formatKwh(12.345, 1)).toBe('12.3 kWh');
  });
});

describe('mission and chapter rewards', () => {
  it('maps mission reward by difficulty', () => {
    expect(getMissionRewardKwh('Medium')).toBe(0.5);
    expect(getMissionRewardKwh('Hard')).toBe(1.5);
    expect(getMissionRewardKwh('Expert')).toBe(3);
  });

  it('returns mission reward in units', () => {
    expect(getMissionRewardUnits('Hard')).toBe(1500);
  });

  it('returns chapter completion reward tiers', () => {
    expect(getChapterCompletionRewardUnits(10)).toBe(2000);
    expect(getChapterCompletionRewardUnits(20)).toBe(4000);
    expect(getChapterCompletionRewardUnits(35)).toBe(8000);
  });
});

describe('tier logic', () => {
  it('returns current tier and next tier', () => {
    expect(getEnergyTier(0).title).toBe('Coffee Corner');
    expect(getNextEnergyTier(0)?.title).toBe('Workspace');
    expect(getEnergyTier(60).title).toBe('Server Rack');
    expect(getNextEnergyTier(60)?.title).toBe('Apartment');
  });

  it('returns 100% at max tier', () => {
    expect(getTierProgressPct(450)).toBe(100);
  });

  it('computes in-tier progress', () => {
    // Tier 2 spans 2..10 kWh, 6kWh is 50% through that tier
    expect(getTierProgressPct(6)).toBeCloseTo(50, 4);
  });
});

describe('device equivalence', () => {
  it('calculates hours powered', () => {
    expect(getHoursPowered(2, 2)).toBe(1);
    expect(getHoursPowered(0.6, 0.06)).toBeCloseTo(10, 4);
  });

  it('handles invalid power values', () => {
    expect(getHoursPowered(2, 0)).toBe(0);
    expect(getHoursPowered(2, -1)).toBe(0);
  });
});
