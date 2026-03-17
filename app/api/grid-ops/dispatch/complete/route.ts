import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { GRID_OPS_ASSET_BY_ID, GRID_OPS_DEFAULT_SCENARIO, isValidScenarioId } from '@/lib/grid-ops/config';
import { computeGridOpsState, normalizeScenarioId } from '@/lib/grid-ops/engine';
import { fetchActiveIncidents } from '@/lib/grid-ops/incidentEngine';
import { getDispatchCallById } from '@/lib/grid-ops/dispatchCallContent';
import {
  ensureGridOpsState,
  fetchUserProgressSnapshot,
  resolveEarnedUnits
} from '@/lib/grid-ops/serverState';
import { createClient } from '@/lib/supabase/server';

const ASSET_CATEGORY_BY_ID = Object.fromEntries(
  Object.entries(GRID_OPS_ASSET_BY_ID).map(([id, asset]) => [id, asset.category])
);

type CompleteRpcRow = {
  success: boolean;
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

  try {
    const clientIp = getClientIp(request);

    await enforceRateLimit({
      scope: 'grid_ops_dispatch_complete_user',
      key: user.id,
      limit: 30,
      windowSeconds: 5 * 60
    });

    await enforceRateLimit({
      scope: 'grid_ops_dispatch_complete_ip',
      key: clientIp,
      limit: 60,
      windowSeconds: 5 * 60
    });

    const body = await parseJsonObject(request);
    const callId = typeof body.callId === 'string' ? body.callId : null;
    const scenarioIdRaw =
      typeof body.scenarioId === 'string' ? body.scenarioId : GRID_OPS_DEFAULT_SCENARIO;

    if (!callId) {
      throw new ApiRouteError('callId is required.', 400);
    }

    if (!isValidScenarioId(scenarioIdRaw)) {
      throw new ApiRouteError(
        'Invalid scenario. Supported: lithuania_v1, iberia_v1, nordic_v1, germany_v1, europe_v1.',
        400
      );
    }

    const scenarioId = normalizeScenarioId(scenarioIdRaw);
    const callDef = getDispatchCallById(callId);

    if (!callDef) {
      throw new ApiRouteError('Unknown dispatch call id.', 400);
    }

    // Atomic: append call_id + award XP
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'grid_ops_complete_dispatch_call',
      {
        p_call_id: callId,
        p_scenario_id: scenarioId,
        p_reward_units: callDef.reward_units
      }
    );

    if (rpcError) {
      throw new ApiRouteError(rpcError.message, 500);
    }

    const rpcRow = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as
      | CompleteRpcRow
      | undefined;

    if (!rpcRow?.success) {
      throw new ApiRouteError(rpcRow?.error_message ?? 'Failed to complete dispatch call.', 400);
    }

    // Re-fetch fresh state
    const [userProgress, stateRow] = await Promise.all([
      fetchUserProgressSnapshot({ supabase, userId: user.id }),
      ensureGridOpsState({ supabase, userId: user.id, scenarioId })
    ]);

    const earnedUnits = resolveEarnedUnits(userProgress);
    const incidents = await fetchActiveIncidents(supabase, user.id, scenarioId);

    const updatedState = computeGridOpsState({
      scenarioId: stateRow.scenario_id,
      earnedUnits,
      row: stateRow,
      incidents
    });

    return NextResponse.json({
      data: {
        completed_call_id: callId,
        reward_units: callDef.reward_units,
        updated_state: updatedState
      }
    });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to complete dispatch call.');
  }
}
