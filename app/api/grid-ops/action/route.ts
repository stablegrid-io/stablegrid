import { NextResponse } from 'next/server';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import {
  computeGridOpsState,
  normalizeScenarioId,
  resolveMilestoneUnlock
} from '@/lib/grid-ops/engine';
import {
  ensureGridOpsState,
  fetchUserProgressSnapshot,
  resolveEarnedUnits
} from '@/lib/grid-ops/serverState';
import { createClient } from '@/lib/supabase/server';

const parseScenarioId = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return GRID_OPS_DEFAULT_SCENARIO;
  }

  if (value !== GRID_OPS_DEFAULT_SCENARIO) {
    return null;
  }

  return value;
};

const statusForDeployError = (errorCode: string | undefined) => {
  switch (errorCode) {
    case 'unauthorized':
      return 401;
    case 'invalid_asset':
      return 400;
    case 'invalid_scenario':
      return 400;
    case 'already_deployed':
      return 409;
    case 'locked_asset':
      return 409;
    case 'insufficient_budget':
      return 409;
    default:
      return 400;
  }
};

type GridOpsRpcRow = {
  user_id: string;
  scenario_id: string;
  turn_index: number;
  deployed_asset_ids: string[];
  last_deployed_asset_id: string | null;
  spent_units: number;
  scenario_seed: number;
  error_code: string | null;
  error_message: string | null;
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const scenarioId = parseScenarioId(payload.scenarioId);
  if (!scenarioId) {
    return NextResponse.json(
      { error: `Invalid scenario. Supported scenario: ${GRID_OPS_DEFAULT_SCENARIO}` },
      { status: 400 }
    );
  }

  const actionType = payload.actionType;
  if (actionType !== 'deploy') {
    return NextResponse.json({ error: 'Invalid action type.' }, { status: 400 });
  }

  const assetId = typeof payload.assetId === 'string' ? payload.assetId : null;
  if (!assetId) {
    return NextResponse.json({ error: 'assetId is required for deploy action.' }, { status: 400 });
  }

  try {
    const userProgress = await fetchUserProgressSnapshot({
      supabase,
      userId: user.id
    });

    const earnedUnits = resolveEarnedUnits(userProgress);
    const existingRow = await ensureGridOpsState({
      supabase,
      userId: user.id,
      scenarioId: normalizeScenarioId(scenarioId),
      userProgress
    });

    const beforeState = computeGridOpsState({
      scenarioId: existingRow.scenario_id,
      earnedUnits,
      row: existingRow
    });

    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'grid_ops_deploy_asset',
      {
        p_scenario_id: scenarioId,
        p_asset_id: assetId
      },
    );

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const rpcRow = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as
      | GridOpsRpcRow
      | undefined;

    if (!rpcRow) {
      return NextResponse.json(
        { error: 'Grid ops deploy RPC returned no state row.' },
        { status: 500 }
      );
    }

    if (rpcRow.error_code) {
      return NextResponse.json(
        {
          error: rpcRow.error_message ?? 'Deploy validation failed.',
          errorCode: rpcRow.error_code
        },
        { status: statusForDeployError(rpcRow.error_code) }
      );
    }

    const nextRow = {
      user_id: rpcRow.user_id,
      scenario_id: normalizeScenarioId(rpcRow.scenario_id),
      turn_index: rpcRow.turn_index,
      deployed_asset_ids: rpcRow.deployed_asset_ids,
      last_deployed_asset_id: rpcRow.last_deployed_asset_id,
      spent_units: rpcRow.spent_units,
      scenario_seed: rpcRow.scenario_seed
    };

    const afterState = computeGridOpsState({
      scenarioId: nextRow.scenario_id,
      earnedUnits,
      row: nextRow
    });

    const activatedRegions = afterState.map.regions
      .filter((region) => {
        const beforeRegion = beforeState.map.regions.find((candidate) => candidate.id === region.id);
        return region.active && !beforeRegion?.active;
      })
      .map((region) => region.id);

    const milestoneUnlocked = resolveMilestoneUnlock({
      before: beforeState.milestones.current,
      after: afterState.milestones.current
    });

    return NextResponse.json({
      data: {
        before_state: beforeState,
        after_state: afterState,
        delta: {
          stability: afterState.simulation.stability_pct - beforeState.simulation.stability_pct,
          risk: afterState.simulation.blackout_risk_pct - beforeState.simulation.blackout_risk_pct,
          budget_units:
            afterState.resources.available_units - beforeState.resources.available_units
        },
        activated_regions: activatedRegions,
        milestone_unlocked: milestoneUnlocked,
        active_event: afterState.events.active_event,
        next_best_action: afterState.recommendation.next_best_action
      },
      storage: 'grid_ops_state'
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to apply grid operations action.'
      },
      { status: 500 }
    );
  }
}
