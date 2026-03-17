import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { GRID_OPS_ASSET_BY_ID, GRID_OPS_DEFAULT_SCENARIO, isValidScenarioId } from '@/lib/grid-ops/config';
import { computeGridOpsState, normalizeScenarioId } from '@/lib/grid-ops/engine';
import {
  escalateExpiredIncidents,
  fetchActiveIncidents
} from '@/lib/grid-ops/incidentEngine';
import {
  ensureGridOpsState,
  fetchUserProgressSnapshot,
  resolveEarnedUnits
} from '@/lib/grid-ops/serverState';
import { createClient } from '@/lib/supabase/server';

const ASSET_CATEGORY_BY_ID = Object.fromEntries(
  Object.entries(GRID_OPS_ASSET_BY_ID).map(([id, asset]) => [id, asset.category])
);

type RepairRpcRow = {
  success: boolean;
  error_code: string | null;
  error_message: string | null;
  repair_cost_units: number;
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

    await Promise.all([
      enforceRateLimit({
        scope: 'grid_ops_repair_user',
        key: user.id,
        limit: 20,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'grid_ops_repair_ip',
        key: clientIp,
        limit: 40,
        windowSeconds: 5 * 60
      })
    ]);

    const body = await parseJsonObject(request);
    const incidentId = typeof body.incidentId === 'string' ? body.incidentId : null;
    const scenarioIdRaw = typeof body.scenarioId === 'string' ? body.scenarioId : GRID_OPS_DEFAULT_SCENARIO;

    if (!incidentId) {
      throw new ApiRouteError('incidentId is required.', 400);
    }

    if (!isValidScenarioId(scenarioIdRaw)) {
      throw new ApiRouteError(
        'Invalid scenario. Supported: lithuania_v1, iberia_v1, nordic_v1, germany_v1, europe_v1.',
        400
      );
    }

    const scenarioId = normalizeScenarioId(scenarioIdRaw);

    // Call the atomic repair RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'grid_ops_repair_incident',
      {
        p_incident_id: incidentId,
        p_user_id: user.id
      }
    );

    if (rpcError) {
      throw new ApiRouteError(rpcError.message, 500);
    }

    const rpcRow = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as
      | RepairRpcRow
      | undefined;

    if (!rpcRow) {
      throw new ApiRouteError('Repair RPC returned no result.', 500);
    }

    if (!rpcRow.success) {
      const status =
        rpcRow.error_code === 'not_found'
          ? 404
          : rpcRow.error_code === 'insufficient_budget'
            ? 409
            : rpcRow.error_code === 'unauthorized'
              ? 401
              : 400;
      throw new ApiRouteError(rpcRow.error_message ?? 'Repair failed.', status, {
        details: { errorCode: rpcRow.error_code }
      });
    }

    // Re-fetch fresh state with the incident now resolved
    const [userProgress, stateRow] = await Promise.all([
      fetchUserProgressSnapshot({ supabase, userId: user.id }),
      ensureGridOpsState({ supabase, userId: user.id, scenarioId })
    ]);

    const earnedUnits = resolveEarnedUnits(userProgress);

    // Escalate any other expired incidents
    await escalateExpiredIncidents(supabase, user.id, scenarioId);
    const incidents = await fetchActiveIncidents(supabase, user.id, scenarioId);

    const updatedState = computeGridOpsState({
      scenarioId: stateRow.scenario_id,
      earnedUnits,
      row: stateRow,
      incidents
    });

    return NextResponse.json({
      data: {
        repaired_incident_id: incidentId,
        repair_cost_units: rpcRow.repair_cost_units,
        updated_state: updatedState
      }
    });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to repair incident.');
  }
}
