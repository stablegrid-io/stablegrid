import { describe, expect, it } from 'vitest';
import {
  ENERGY_UNITS_PER_KWH,
  formatKwh,
  getAvailableBudgetUnits,
  getChapterCompletionRewardUnits,
  getGridStabilityPct,
  getMissionRewardKwh,
  getMissionRewardUnits,
  getPracticeRewardKwh,
  getSpentInfrastructureUnits,
  getStabilityTier,
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

describe('reward model', () => {
  it('maps mission reward by difficulty', () => {
    expect(getMissionRewardKwh('Medium')).toBe(0.4);
    expect(getMissionRewardKwh('Hard')).toBe(1.4);
    expect(getMissionRewardKwh('Expert')).toBe(2.4);
  });

  it('returns mission reward in units', () => {
    expect(getMissionRewardUnits('Hard')).toBe(1400);
  });

  it('returns fixed chapter completion reward', () => {
    expect(getChapterCompletionRewardUnits(10)).toBe(150);
    expect(getChapterCompletionRewardUnits(20)).toBe(150);
    expect(getChapterCompletionRewardUnits(35)).toBe(150);
  });

  it('maps practice rewards by difficulty', () => {
    expect(getPracticeRewardKwh('easy')).toBe(0.04);
    expect(getPracticeRewardKwh('medium')).toBe(0.08);
    expect(getPracticeRewardKwh('hard')).toBe(0.12);
  });
});

describe('infrastructure budget and stability', () => {
  it('computes spent and available deployment budget', () => {
    const deployedNodeIds = ['control-center', 'smart-transformer', 'solar-forecasting-array'];
    const spent = getSpentInfrastructureUnits(deployedNodeIds);
    expect(spent).toBe(5000);

    const available = getAvailableBudgetUnits(10000, deployedNodeIds);
    expect(available).toBe(5000);
  });

  it('matches the documented stability progression', () => {
    expect(getGridStabilityPct(['control-center'])).toBe(65);

    expect(
      getGridStabilityPct([
        'control-center',
        'battery-storage',
        'frequency-controller'
      ])
    ).toBe(92);
  });

  it('resolves stability tiers', () => {
    expect(getStabilityTier(92).label).toBe('OPTIMAL');
    expect(getStabilityTier(80).label).toBe('STABLE');
    expect(getStabilityTier(60).label).toBe('MARGINAL');
    expect(getStabilityTier(35).label).toBe('UNSTABLE');
    expect(getStabilityTier(10).label).toBe('CRITICAL');
  });
});
