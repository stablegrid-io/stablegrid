import { NextResponse } from 'next/server';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import {
  computeGridOpsState,
  normalizeScenarioId
} from '@/lib/grid-ops/engine';
import {
  ensureGridOpsState,
  fetchUserProgressSnapshot,
  resolveEarnedUnits
} from '@/lib/grid-ops/serverState';
import { createClient } from '@/lib/supabase/server';

const parseScenarioId = (value: string | null) => {
  if (!value || value === GRID_OPS_DEFAULT_SCENARIO) {
    return GRID_OPS_DEFAULT_SCENARIO;
  }

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
      { error: `Invalid scenario. Supported scenario: ${GRID_OPS_DEFAULT_SCENARIO}` },
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
    const computed = computeGridOpsState({
      scenarioId: stateRow.scenario_id,
      earnedUnits,
      row: stateRow
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
