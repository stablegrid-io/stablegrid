import { describe, expect, it } from 'vitest';
import {
  applyDeployAction,
  computeGridOpsState,
  computeSpentUnits,
  ensureStateRowShape,
  validateDeployAction
} from '@/lib/grid-ops/engine';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import type { GridOpsStateRow } from '@/lib/grid-ops/types';

const baseRow: GridOpsStateRow = {
  user_id: 'user-1',
  scenario_id: GRID_OPS_DEFAULT_SCENARIO,
  turn_index: 0,
  deployed_asset_ids: ['control-center'],
  last_deployed_asset_id: null,
  spent_units: 0,
  scenario_seed: 1
};

describe('grid-ops engine', () => {
  it('computes spent units from deployed assets', () => {
    expect(computeSpentUnits(['control-center'])).toBe(0);
    expect(computeSpentUnits(['control-center', 'smart-transformer'])).toBe(2000);
    expect(
      computeSpentUnits(['control-center', 'smart-transformer', 'solar-forecasting-array'])
    ).toBe(5000);
  });

  it('validates deploy actions for lock and budget rules', () => {
    const locked = validateDeployAction({
      assetId: 'battery-storage',
      deployedAssetIds: ['control-center'],
      availableUnits: 100000
    });
    expect(locked.ok).toBe(false);
    expect(locked.errorCode).toBe('locked_asset');

    const insufficient = validateDeployAction({
      assetId: 'smart-transformer',
      deployedAssetIds: ['control-center'],
      availableUnits: 1000
    });
    expect(insufficient.ok).toBe(false);
    expect(insufficient.errorCode).toBe('insufficient_budget');

    const valid = validateDeployAction({
      assetId: 'smart-transformer',
      deployedAssetIds: ['control-center'],
      availableUnits: 2000
    });
    expect(valid.ok).toBe(true);
  });

  it('cycles deterministic events every two turns', () => {
    const turn0 = computeGridOpsState({ earnedUnits: 20000, row: { ...baseRow, turn_index: 0 } });
    const turn2 = computeGridOpsState({ earnedUnits: 20000, row: { ...baseRow, turn_index: 2 } });
    const turn4 = computeGridOpsState({ earnedUnits: 20000, row: { ...baseRow, turn_index: 4 } });
    const turn6 = computeGridOpsState({ earnedUnits: 20000, row: { ...baseRow, turn_index: 6 } });

    expect(turn0.events.active_event.id).toBe('cloud_cover_surge');
    expect(turn2.events.active_event.id).toBe('evening_peak');
    expect(turn4.events.active_event.id).toBe('wind_ramp');
    expect(turn6.events.active_event.id).toBe('cloud_cover_surge');
    expect(turn0.map.nodes[0].visual_category).toBeTruthy();
    expect(turn0.map.edges.every((edge) => Boolean(edge.tier))).toBe(true);
  });

  it('applies synergy bonuses to metrics', () => {
    const withoutSynergy = computeGridOpsState({
      earnedUnits: 40000,
      row: {
        ...baseRow,
        deployed_asset_ids: ['control-center', 'smart-transformer', 'solar-forecasting-array'],
        spent_units: 5000,
        turn_index: 1
      }
    });

    const withSynergy = computeGridOpsState({
      earnedUnits: 40000,
      row: {
        ...baseRow,
        deployed_asset_ids: [
          'control-center',
          'smart-transformer',
          'solar-forecasting-array',
          'battery-storage'
        ],
        spent_units: 10000,
        turn_index: 1
      }
    });

    expect(withSynergy.active_synergy_ids).toContain('solar-battery-synergy');
    expect(withSynergy.simulation.stability_pct).toBeGreaterThan(withoutSynergy.simulation.stability_pct);
    expect(withSynergy.simulation.forecast_confidence_pct).toBeGreaterThan(
      withoutSynergy.simulation.forecast_confidence_pct
    );
  });

  it('updates milestone stage and recommendation after deployment', () => {
    const before = computeGridOpsState({
      earnedUnits: 12000,
      row: { ...baseRow }
    });

    const progressed = applyDeployAction({
      row: {
        ...baseRow,
        deployed_asset_ids: ['control-center'],
        spent_units: 0,
        turn_index: 0
      },
      assetId: 'smart-transformer'
    });

    const after = computeGridOpsState({ earnedUnits: 12000, row: progressed });

    expect(after.resources.available_units).toBe(before.resources.available_units - 2000);
    expect(after.simulation.turn_index).toBe(1);
    expect(after.simulation.stability_pct).toBeGreaterThan(before.simulation.stability_pct);
    expect(after.milestones.current?.threshold ?? 0).toBeGreaterThanOrEqual(
      before.milestones.current?.threshold ?? 0
    );
    expect(after.recommendation.next_best_action.action.length).toBeGreaterThan(0);
  });

  it('shows only deployed assets in map nodes and edges', () => {
    const state = computeGridOpsState({
      earnedUnits: 0,
      row: {
        ...baseRow,
        deployed_asset_ids: ['control-center'],
        spent_units: 0,
        turn_index: 0
      }
    });

    expect(state.map.nodes.map((node) => node.id)).toEqual(['control-center']);
    expect(state.map.edges).toEqual([]);
  });

  it('normalizes malformed state rows', () => {
    const normalized = ensureStateRowShape({
      userId: 'user-1',
      scenarioId: GRID_OPS_DEFAULT_SCENARIO,
      row: {
        deployed_asset_ids: ['missing-asset'],
        turn_index: -5,
        scenario_seed: 0,
        spent_units: -1
      }
    });

    expect(normalized.deployed_asset_ids).toEqual(['control-center']);
    expect(normalized.turn_index).toBe(0);
    expect(normalized.scenario_seed).toBe(1);
    expect(normalized.spent_units).toBe(0);
  });
});
