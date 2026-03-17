import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { GRID_OPS_DEFAULT_SCENARIO, isValidScenarioId } from '@/lib/grid-ops/config';
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
  if (typeof value !== 'string' || value.length === 0) return GRID_OPS_DEFAULT_SCENARIO;
  if (isValidScenarioId(value)) return value;
  return null;
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

interface GridOpsActionPayload {
  actionType: 'deploy';
  assetId: string;
  scenarioId: string;
}

const parseGridOpsActionPayload = async (request: Request) => {
  const payload = await parseJsonObject(request);
  const scenarioId = parseScenarioId(payload.scenarioId);
  if (!scenarioId) {
    throw new ApiRouteError(
      'Invalid scenario. Supported: lithuania_v1, iberia_v1, nordic_v1, germany_v1, europe_v1.',
      400
    );
  }

  const actionType = payload.actionType;
  if (actionType !== 'deploy') {
    throw new ApiRouteError('Invalid action type.', 400);
  }

  const assetId = typeof payload.assetId === 'string' ? payload.assetId : null;
  if (!assetId) {
    throw new ApiRouteError('assetId is required for deploy action.', 400);
  }

  return {
    actionType,
    assetId,
    scenarioId
  } satisfies GridOpsActionPayload;
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

  try {
    const payload = await parseGridOpsActionPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'grid_ops_action_user',
        key: user.id,
        limit: 30,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'grid_ops_action_ip',
        key: clientIp,
        limit: 60,
        windowSeconds: 5 * 60
      })
    ]);

    const response = await runIdempotentJsonRequest({
      scope: 'grid_ops_action',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: payload,
      execute: async () => {
        const userProgress = await fetchUserProgressSnapshot({
          supabase,
          userId: user.id
        });

        const earnedUnits = resolveEarnedUnits(userProgress);
        const existingRow = await ensureGridOpsState({
          supabase,
          userId: user.id,
          scenarioId: normalizeScenarioId(payload.scenarioId),
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
            p_scenario_id: payload.scenarioId,
            p_asset_id: payload.assetId
          }
        );

        if (rpcError) {
          throw new ApiRouteError(rpcError.message, 500);
        }

        const rpcRow = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as
          | GridOpsRpcRow
          | undefined;

        if (!rpcRow) {
          throw new ApiRouteError('Grid ops deploy RPC returned no state row.', 500);
        }

        if (rpcRow.error_code) {
          throw new ApiRouteError(
            rpcRow.error_message ?? 'Deploy validation failed.',
            statusForDeployError(rpcRow.error_code),
            {
              details: {
                errorCode: rpcRow.error_code
              }
            }
          );
        }

        const nextRow = {
          user_id: rpcRow.user_id,
          scenario_id: normalizeScenarioId(rpcRow.scenario_id),
          turn_index: rpcRow.turn_index,
          deployed_asset_ids: rpcRow.deployed_asset_ids,
          last_deployed_asset_id: rpcRow.last_deployed_asset_id,
          spent_units: rpcRow.spent_units,
          scenario_seed: rpcRow.scenario_seed,
          // deploy action does not affect completed dispatch calls — carry over from existing row
          completed_dispatch_call_ids: existingRow.completed_dispatch_call_ids
        };

        const afterState = computeGridOpsState({
          scenarioId: nextRow.scenario_id,
          earnedUnits,
          row: nextRow
        });

        const activatedRegions = afterState.map.regions
          .filter((region) => {
            const beforeRegion = beforeState.map.regions.find(
              (candidate) => candidate.id === region.id
            );
            return region.active && !beforeRegion?.active;
          })
          .map((region) => region.id);

        const milestoneUnlocked = resolveMilestoneUnlock({
          before: beforeState.milestones.current,
          after: afterState.milestones.current
        });

        return {
          body: {
            data: {
              before_state: beforeState,
              after_state: afterState,
              delta: {
                stability:
                  afterState.simulation.stability_pct - beforeState.simulation.stability_pct,
                risk:
                  afterState.simulation.blackout_risk_pct -
                  beforeState.simulation.blackout_risk_pct,
                budget_units:
                  afterState.resources.available_units - beforeState.resources.available_units
              },
              activated_regions: activatedRegions,
              milestone_unlocked: milestoneUnlocked,
              active_event: afterState.events.active_event,
              next_best_action: afterState.recommendation.next_best_action
            },
            storage: 'grid_ops_state'
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to apply grid operations action.');
  }
}
