import { NextResponse } from 'next/server';
import { GRID_OPS_ASSET_BY_ID, GRID_OPS_DEFAULT_SCENARIO, isValidScenarioId } from '@/lib/grid-ops/config';
import {
  computeGridOpsState,
  normalizeScenarioId
} from '@/lib/grid-ops/engine';
import {
  escalateExpiredIncidents,
  fetchActiveIncidents,
  generateIncidentIfNeeded
} from '@/lib/grid-ops/incidentEngine';
import {
  ensureGridOpsState,
  fetchUserProgressSnapshot,
  resolveEarnedUnits
} from '@/lib/grid-ops/serverState';
import { createClient } from '@/lib/supabase/server';

// Pre-build category lookup from the static asset config (module-level, runs once)
const ASSET_CATEGORY_BY_ID = Object.fromEntries(
  Object.entries(GRID_OPS_ASSET_BY_ID).map(([id, asset]) => [id, asset.category])
);

const parseScenarioId = (value: string | null) => {
  if (!value) return GRID_OPS_DEFAULT_SCENARIO;
  if (isValidScenarioId(value)) return value;
  return null;
};

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const scenarioParam = url.searchParams.get('scenario');
  const parsedScenario = parseScenarioId(scenarioParam);

  if (!parsedScenario) {
    return NextResponse.json(
      { error: 'Invalid scenario. Supported: lithuania_v1, iberia_v1, nordic_v1, germany_v1, europe_v1.' },
      { status: 400 }
    );
  }

  try {
    const userProgress = await fetchUserProgressSnapshot({
      supabase,
      userId: user.id
    });

    const stateRow = await ensureGridOpsState({
      supabase,
      userId: user.id,
      scenarioId: normalizeScenarioId(parsedScenario),
      userProgress
    });

    const earnedUnits = resolveEarnedUnits(userProgress);

    // ── Incident lifecycle orchestration ─────────────────────────────────────
    // 1. Escalate any incidents whose escalates_at has passed
    await escalateExpiredIncidents(supabase, user.id, stateRow.scenario_id);

    // 2. Fetch current active incidents (post-escalation)
    const preIncidents = await fetchActiveIncidents(supabase, user.id, stateRow.scenario_id);

    // 3. Rough stability estimate for the generation guard (avoids a full compute)
    const roughStability = Math.min(
      120,
      30 + Math.floor(stateRow.deployed_asset_ids.length * 4)
    );

    // 4. Maybe generate a new incident (ON CONFLICT DO NOTHING keeps it idempotent)
    await generateIncidentIfNeeded(
      supabase,
      user.id,
      stateRow.scenario_id,
      stateRow,
      preIncidents,
      roughStability,
      ASSET_CATEGORY_BY_ID
    );

    // 5. Re-fetch to include any newly generated incident
    const incidents = await fetchActiveIncidents(supabase, user.id, stateRow.scenario_id);
    // ─────────────────────────────────────────────────────────────────────────

    const computed = computeGridOpsState({
      scenarioId: stateRow.scenario_id,
      earnedUnits,
      row: stateRow,
      incidents
    });

    return NextResponse.json({
      data: computed,
      storage: 'grid_ops_state'
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch grid operations state.'
      },
      { status: 500 }
    );
  }
}
