import { NextResponse } from 'next/server';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import {
  GRID_OPS_CAMPAIGN,
  GRID_OPS_DEFAULT_SCENARIO,
  GRID_OPS_VALID_SCENARIO_IDS
} from '@/lib/grid-ops/config';
import { computeGridOpsState } from '@/lib/grid-ops/engine';
import { fetchUserProgressSnapshot, resolveEarnedUnits } from '@/lib/grid-ops/serverState';
import type {
  GridOpsCampaignScenarioProgress,
  GridOpsCampaignState,
  GridOpsCampaignView,
  GridOpsScenarioId,
  GridOpsStateRow
} from '@/lib/grid-ops/types';
import { createClient } from '@/lib/supabase/server';

// Fetch all state rows for the user in a single query, keyed by scenario_id
const fetchAllScenarioRows = async ({
  supabase,
  userId
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
}): Promise<Map<GridOpsScenarioId, GridOpsStateRow>> => {
  const ids = [...GRID_OPS_VALID_SCENARIO_IDS];

  const { data, error } = await supabase
    .from('grid_ops_state')
    .select(
      'user_id,scenario_id,turn_index,deployed_asset_ids,last_deployed_asset_id,spent_units,scenario_seed,completed_dispatch_call_ids'
    )
    .eq('user_id', userId)
    .in('scenario_id', ids);

  if (error) {
    throw new Error(error.message);
  }

  const map = new Map<GridOpsScenarioId, GridOpsStateRow>();
  if (Array.isArray(data)) {
    for (const row of data) {
      map.set(row.scenario_id as GridOpsScenarioId, row as GridOpsStateRow);
    }
  }

  return map;
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

  await Promise.all([
    enforceRateLimit({ scope: 'grid_ops_campaign_user', key: user.id, limit: 30, windowSeconds: 300 }),
    enforceRateLimit({ scope: 'grid_ops_campaign_ip', key: getClientIp(request), limit: 60, windowSeconds: 300 }),
  ]);

  try {
    const [userProgress, stateRows] = await Promise.all([
      fetchUserProgressSnapshot({ supabase, userId: user.id }),
      fetchAllScenarioRows({ supabase, userId: user.id })
    ]);

    const earnedUnits = resolveEarnedUnits(userProgress);

    // Compute stability for each scenario that has a state row (no incidents = best-case)
    const stabilityByScenario = new Map<GridOpsScenarioId, number>();
    for (const [scenarioId, row] of stateRows.entries()) {
      try {
        const computed = computeGridOpsState({
          scenarioId,
          earnedUnits,
          row,
          incidents: [] // best-case: no active incidents
        });
        stabilityByScenario.set(scenarioId, computed.simulation.stability_pct);
      } catch {
        // If compute fails for any reason, treat as not started
      }
    }

    // Build campaign progress: determine state for each scenario
    // A scenario is completed if best-case stability >= completionThreshold
    const completedScenarioIds = new Set<GridOpsScenarioId>();
    for (const scenario of GRID_OPS_CAMPAIGN) {
      const stability = stabilityByScenario.get(scenario.id) ?? 0;
      if (stability >= scenario.completionThreshold) {
        completedScenarioIds.add(scenario.id);
      }
    }

    const progressList: GridOpsCampaignScenarioProgress[] = GRID_OPS_CAMPAIGN.map((scenario) => {
      const row = stateRows.get(scenario.id);
      const stability = stabilityByScenario.get(scenario.id) ?? null;
      const deployedCount = row?.deployed_asset_ids?.length ?? 0;

      // Determine unlock state
      const isUnlocked =
        scenario.unlockAfter === null || completedScenarioIds.has(scenario.unlockAfter);

      let state: GridOpsCampaignState;
      if (!isUnlocked) {
        state = 'locked';
      } else if (completedScenarioIds.has(scenario.id)) {
        state = 'completed';
      } else if (deployedCount > 0) {
        state = 'in_progress';
      } else {
        state = 'available';
      }

      return {
        scenario,
        state,
        stability_pct: stability,
        deployed_count: deployedCount
      };
    });

    const campaignView: GridOpsCampaignView = { scenarios: progressList };

    return NextResponse.json({ data: campaignView });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch campaign progress.'
      },
      { status: 500 }
    );
  }
}
