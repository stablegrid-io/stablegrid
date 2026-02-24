import {
  computeSpentUnits,
  ensureStateRowShape,
  normalizeDeployedAssetIds,
  normalizeScenarioId
} from '@/lib/grid-ops/engine';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import type { GridOpsScenarioId, GridOpsStateRow } from '@/lib/grid-ops/types';

interface UserProgressSnapshot {
  xp: number | null;
  deployed_node_ids?: string[] | null;
  last_deployed_node_id?: string | null;
}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const resolveEarnedUnits = (progress: UserProgressSnapshot | null) => {
  if (!progress) {
    return 0;
  }

  return isFiniteNumber(progress.xp) ? Math.max(0, Math.floor(progress.xp)) : 0;
};

export const fetchUserProgressSnapshot = async ({
  supabase,
  userId
}: {
  supabase: any;
  userId: string;
}) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('xp,deployed_node_ids,last_deployed_node_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const insertGridOpsState = async ({
  supabase,
  row
}: {
  supabase: any;
  row: GridOpsStateRow;
}) => {
  const { data, error } = await supabase
    .from('grid_ops_state')
    .insert({
      user_id: row.user_id,
      scenario_id: row.scenario_id,
      turn_index: row.turn_index,
      deployed_asset_ids: row.deployed_asset_ids,
      last_deployed_asset_id: row.last_deployed_asset_id,
      spent_units: row.spent_units,
      scenario_seed: row.scenario_seed
    })
    .select(
      'user_id,scenario_id,turn_index,deployed_asset_ids,last_deployed_asset_id,spent_units,scenario_seed,created_at,updated_at'
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Failed to insert grid ops state row.');
  }

  return data;
};

const fetchGridOpsStateRow = async ({
  supabase,
  userId,
  scenarioId
}: {
  supabase: any;
  userId: string;
  scenarioId: GridOpsScenarioId;
}) => {
  const { data, error } = await supabase
    .from('grid_ops_state')
    .select(
      'user_id,scenario_id,turn_index,deployed_asset_ids,last_deployed_asset_id,spent_units,scenario_seed,created_at,updated_at'
    )
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const ensureGridOpsState = async ({
  supabase,
  userId,
  scenarioId,
  userProgress
}: {
  supabase: any;
  userId: string;
  scenarioId?: GridOpsScenarioId;
  userProgress?: UserProgressSnapshot | null;
}) => {
  const resolvedScenario = normalizeScenarioId(scenarioId ?? GRID_OPS_DEFAULT_SCENARIO);

  const existingRow = await fetchGridOpsStateRow({
    supabase,
    userId,
    scenarioId: resolvedScenario
  });

  if (existingRow) {
    return ensureStateRowShape({
      userId,
      row: existingRow,
      scenarioId: resolvedScenario
    });
  }

  const fallbackDeployedAssetIds = normalizeDeployedAssetIds(userProgress?.deployed_node_ids);
  const lastDeployedAssetId =
    typeof userProgress?.last_deployed_node_id === 'string' &&
    fallbackDeployedAssetIds.includes(userProgress.last_deployed_node_id)
      ? userProgress.last_deployed_node_id
      : null;

  const seededRow: GridOpsStateRow = {
    user_id: userId,
    scenario_id: resolvedScenario,
    turn_index: Math.max(0, fallbackDeployedAssetIds.length - 1),
    deployed_asset_ids: fallbackDeployedAssetIds,
    last_deployed_asset_id: lastDeployedAssetId,
    spent_units: computeSpentUnits(fallbackDeployedAssetIds),
    scenario_seed: 1
  };

  const inserted = await insertGridOpsState({
    supabase,
    row: seededRow
  });

  return ensureStateRowShape({
    userId,
    row: inserted,
    scenarioId: resolvedScenario
  });
};
