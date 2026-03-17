import { describe, expect, it } from 'vitest';
import { GRID_OPS_ASSET_BY_ID, GRID_OPS_ASSETS } from '@/lib/grid-ops/config';
import { computeGridOpsState } from '@/lib/grid-ops/engine';
import {
  GRID_SCENE_ASSET_REGISTRY,
  resolveSceneAssetDescriptor
} from '@/lib/grid-ops/sceneAssets';
import {
  GRID_MAP_DIMENSIONS,
  resolveEdgeTier,
  resolveNodeMapLayout,
  resolveNodeVisualHints
} from '@/lib/grid-ops/visualConfig';

describe('grid-ops visual mapping', () => {
  it('maps known assets to category/icon/importance/micro indicator hints', () => {
    const hints = resolveNodeVisualHints(GRID_OPS_ASSET_BY_ID['control-center']);

    expect(hints.visual_category).toBe('monitoring');
    expect(hints.visual_icon).toBe('radar');
    expect(hints.importance).toBe('anchor');
    expect(hints.micro_indicator).toBe('sync');
  });

  it('contains model descriptors for all grid assets', () => {
    for (const asset of GRID_OPS_ASSETS) {
      const descriptor = resolveSceneAssetDescriptor(asset.id);
      expect(descriptor).toBeTruthy();
      expect(descriptor?.url ?? '').toMatch(/\.glb(?:\?.*)?$/);
      expect(descriptor?.scale).toBeGreaterThan(0);
    }

    expect(Object.keys(GRID_SCENE_ASSET_REGISTRY)).toHaveLength(GRID_OPS_ASSETS.length);
  });

  it('resolves edge tiers based on strategic importance', () => {
    const controlToTransformer = resolveEdgeTier({
      fromAsset: GRID_OPS_ASSET_BY_ID['control-center'],
      toAsset: GRID_OPS_ASSET_BY_ID['smart-transformer']
    });

    const demandToAi = resolveEdgeTier({
      fromAsset: GRID_OPS_ASSET_BY_ID['demand-response-system'],
      toAsset: GRID_OPS_ASSET_BY_ID['ai-grid-optimizer']
    });

    expect(controlToTransformer).toBe('backbone');
    expect(demandToAi).toBe('secondary');
  });

  it('builds evenly spaced node coordinates inside safe map bounds', () => {
    const layout = resolveNodeMapLayout([
      'control-center',
      'smart-transformer',
      'solar-forecasting-array',
      'battery-storage',
      'frequency-controller',
      'ai-grid-optimizer'
    ]);

    Object.values(layout).forEach((position) => {
      expect(position.x).toBeGreaterThanOrEqual(GRID_MAP_DIMENSIONS.safePadding);
      expect(position.x).toBeLessThanOrEqual(GRID_MAP_DIMENSIONS.width - GRID_MAP_DIMENSIONS.safePadding);
      expect(position.y).toBeGreaterThanOrEqual(GRID_MAP_DIMENSIONS.safePadding);
      expect(position.y).toBeLessThanOrEqual(GRID_MAP_DIMENSIONS.height - GRID_MAP_DIMENSIONS.safePadding);
    });

    expect(layout['control-center'].x).toBeLessThan(layout['smart-transformer'].x);
    expect(layout['smart-transformer'].y).toBeLessThan(layout['control-center'].y);
  });

  it('includes additive visual hints in computed API state payloads', () => {
    const state = computeGridOpsState({
      earnedUnits: 20000,
      row: {
        user_id: 'user-1',
        scenario_id: 'iberia_v1',
        turn_index: 0,
        deployed_asset_ids: ['control-center', 'smart-transformer'],
        last_deployed_asset_id: 'smart-transformer',
        spent_units: 2000,
        scenario_seed: 1,
        completed_dispatch_call_ids: []
      }
    });

    const controlNode = state.map.nodes.find((node) => node.id === 'control-center');
    expect(controlNode?.visual_category).toBe('monitoring');
    expect(controlNode?.visual_icon).toBe('radar');
    expect(controlNode?.importance).toBe('anchor');
    expect(controlNode?.micro_indicator).toBe('sync');

    expect(state.map.edges[0].tier).toBeTruthy();
  });
});
