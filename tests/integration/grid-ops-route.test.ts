import { beforeEach, describe, expect, it, vi } from 'vitest';

interface UserProgressRow {
  user_id: string;
  xp: number;
  deployed_node_ids?: string[];
  last_deployed_node_id?: string | null;
}

interface GridOpsStateRow {
  user_id: string;
  scenario_id: string;
  turn_index: number;
  deployed_asset_ids: string[];
  last_deployed_asset_id: string | null;
  spent_units: number;
  scenario_seed: number;
  created_at?: string;
  updated_at?: string;
}

const createClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

const ASSET_COSTS: Record<string, number> = {
  'control-center': 0,
  'smart-transformer': 2000,
  'solar-forecasting-array': 3000,
  'battery-storage': 5000,
  'frequency-controller': 7000,
  'demand-response-system': 10000,
  'grid-flywheel': 12000,
  'hvdc-interconnector': 15000,
  'ai-grid-optimizer': 18000
};

const ASSET_PREREQS: Record<string, string | null> = {
  'control-center': null,
  'smart-transformer': 'control-center',
  'solar-forecasting-array': 'smart-transformer',
  'battery-storage': 'solar-forecasting-array',
  'frequency-controller': 'battery-storage',
  'demand-response-system': 'frequency-controller',
  'grid-flywheel': 'demand-response-system',
  'hvdc-interconnector': 'grid-flywheel',
  'ai-grid-optimizer': 'hvdc-interconnector'
};

const computeSpentUnits = (assetIds: string[]) =>
  assetIds.reduce((sum, assetId) => sum + (ASSET_COSTS[assetId] ?? 0), 0);

const makeSupabaseClient = ({
  userProgressRows,
  gridOpsRows
}: {
  userProgressRows: UserProgressRow[];
  gridOpsRows: GridOpsStateRow[];
}) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })
  },
  from: vi.fn((table: string) => {
    if (table === 'user_progress') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, userId: string) => ({
            maybeSingle: vi.fn(async () => ({
              data: userProgressRows.find((row) => row.user_id === userId) ?? null,
              error: null
            }))
          }))
        }))
      };
    }

    if (table === 'grid_ops_state') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, userId: string) => ({
            eq: vi.fn((_scenarioColumn: string, scenarioId: string) => ({
              maybeSingle: vi.fn(async () => ({
                data:
                  gridOpsRows.find(
                    (row) => row.user_id === userId && row.scenario_id === scenarioId
                  ) ?? null,
                error: null
              }))
            }))
          }))
        })),
        insert: vi.fn((payload: GridOpsStateRow) => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => {
              const inserted = {
                ...payload,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              gridOpsRows.push(inserted);
              return { data: inserted, error: null };
            })
          }))
        })),
        upsert: vi.fn(async (payload: GridOpsStateRow) => {
          const existingIndex = gridOpsRows.findIndex(
            (row) => row.user_id === payload.user_id && row.scenario_id === payload.scenario_id
          );

          if (existingIndex >= 0) {
            gridOpsRows[existingIndex] = {
              ...gridOpsRows[existingIndex],
              ...payload,
              updated_at: new Date().toISOString()
            };
          } else {
            gridOpsRows.push({
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }

          return { error: null };
        })
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  }),
  rpc: vi.fn(
    async (
      fnName: string,
      args: { p_scenario_id?: string; p_asset_id?: string } | null
    ) => {
      if (fnName !== 'grid_ops_deploy_asset') {
        return {
          data: null,
          error: { message: `Unexpected RPC: ${fnName}` }
        };
      }

      const scenarioId = args?.p_scenario_id ?? 'iberia_v1';
      const assetId = args?.p_asset_id ?? '';
      const userId = 'user-1';
      const userProgress = userProgressRows.find((row) => row.user_id === userId) ?? {
        user_id: userId,
        xp: 0
      };

      const row = gridOpsRows.find(
        (entry) => entry.user_id === userId && entry.scenario_id === scenarioId
      );

      if (!row) {
        return {
          data: [
            {
              user_id: userId,
              scenario_id: scenarioId,
              turn_index: 0,
              deployed_asset_ids: ['control-center'],
              last_deployed_asset_id: null,
              spent_units: 0,
              scenario_seed: 1,
              error_code: 'invalid_state',
              error_message: 'Missing grid ops state'
            }
          ],
          error: null
        };
      }

      if (!ASSET_COSTS[assetId] && assetId !== 'control-center') {
        return {
          data: [
            {
              ...row,
              error_code: 'invalid_asset',
              error_message: 'Asset is not defined for this scenario.'
            }
          ],
          error: null
        };
      }

      if (row.deployed_asset_ids.includes(assetId)) {
        return {
          data: [
            {
              ...row,
              error_code: 'already_deployed',
              error_message: 'Asset is already deployed.'
            }
          ],
          error: null
        };
      }

      const prerequisite = ASSET_PREREQS[assetId];
      if (prerequisite && !row.deployed_asset_ids.includes(prerequisite)) {
        return {
          data: [
            {
              ...row,
              error_code: 'locked_asset',
              error_message: `Asset is locked. Deploy ${prerequisite} first.`
            }
          ],
          error: null
        };
      }

      const availableUnits = Math.max(0, (userProgress.xp ?? 0) - row.spent_units);
      const cost = ASSET_COSTS[assetId] ?? 0;
      if (availableUnits < cost) {
        return {
          data: [
            {
              ...row,
              error_code: 'insufficient_budget',
              error_message: 'Insufficient kWh budget.'
            }
          ],
          error: null
        };
      }

      const nextDeployed = [...row.deployed_asset_ids, assetId];
      row.deployed_asset_ids = nextDeployed;
      row.last_deployed_asset_id = assetId;
      row.turn_index += 1;
      row.spent_units = computeSpentUnits(nextDeployed);

      return {
        data: [
          {
            ...row,
            error_code: null,
            error_message: null
          }
        ],
        error: null
      };
    }
  )
});

const getState = async (scenario = 'iberia_v1') => {
  const { GET } = await import('@/app/api/grid-ops/state/route');
  return GET(new Request(`http://localhost/api/grid-ops/state?scenario=${scenario}`));
};

const postAction = async (payload: Record<string, unknown>) => {
  const { POST } = await import('@/app/api/grid-ops/action/route');
  return POST(
    new Request('http://localhost/api/grid-ops/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  );
};

describe('grid-ops routes', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
  });

  it('GET seeds missing grid_ops_state from user_progress', async () => {
    const userProgressRows: UserProgressRow[] = [
      {
        user_id: 'user-1',
        xp: 8000,
        deployed_node_ids: ['control-center', 'smart-transformer'],
        last_deployed_node_id: 'smart-transformer'
      }
    ];
    const gridOpsRows: GridOpsStateRow[] = [];

    createClientMock.mockReturnValue(makeSupabaseClient({ userProgressRows, gridOpsRows }));

    const response = await getState();
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: {
        resources: { spent_units: number; available_units: number };
        simulation: { turn_index: number };
        map: {
          nodes: Array<{
            id: string;
            visual_category?: string;
            visual_icon?: string;
            importance?: string;
            micro_indicator?: string;
          }>;
          edges: Array<{
            id: string;
            tier?: string;
          }>;
        };
      };
    };

    expect(gridOpsRows).toHaveLength(1);
    expect(gridOpsRows[0].deployed_asset_ids).toEqual(['control-center', 'smart-transformer']);
    expect(payload.data.resources.spent_units).toBe(2000);
    expect(payload.data.resources.available_units).toBe(6000);
    expect(payload.data.simulation.turn_index).toBe(1);
    expect(payload.data.map.nodes[0].visual_category).toBeTruthy();
    expect(payload.data.map.nodes[0].visual_icon).toBeTruthy();
    expect(payload.data.map.nodes[0].importance).toBeTruthy();
    expect(payload.data.map.nodes[0].micro_indicator).toBeTruthy();
    expect(payload.data.map.edges[0].tier).toBeTruthy();
  });

  it('POST deploy updates spent budget and turn index', async () => {
    const userProgressRows: UserProgressRow[] = [{ user_id: 'user-1', xp: 10000 }];
    const gridOpsRows: GridOpsStateRow[] = [
      {
        user_id: 'user-1',
        scenario_id: 'iberia_v1',
        turn_index: 0,
        deployed_asset_ids: ['control-center'],
        last_deployed_asset_id: null,
        spent_units: 0,
        scenario_seed: 1
      }
    ];

    createClientMock.mockReturnValue(makeSupabaseClient({ userProgressRows, gridOpsRows }));

    const response = await postAction({
      scenarioId: 'iberia_v1',
      actionType: 'deploy',
      assetId: 'smart-transformer'
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: {
        delta: { stability: number; budget_units: number };
        after_state: {
          map: {
            nodes: Array<{ visual_category?: string; visual_icon?: string }>;
            edges: Array<{ tier?: string }>;
          };
        };
      };
    };

    expect(gridOpsRows[0].deployed_asset_ids).toEqual(['control-center', 'smart-transformer']);
    expect(gridOpsRows[0].turn_index).toBe(1);
    expect(gridOpsRows[0].spent_units).toBe(2000);
    expect(payload.data.delta.stability).toBeGreaterThan(0);
    expect(payload.data.delta.budget_units).toBe(-2000);
    expect(payload.data.after_state.map.nodes[0].visual_category).toBeTruthy();
    expect(payload.data.after_state.map.nodes[0].visual_icon).toBeTruthy();
    expect(payload.data.after_state.map.edges[0].tier).toBeTruthy();
  });

  it('POST deploy rejects locked assets', async () => {
    const userProgressRows: UserProgressRow[] = [{ user_id: 'user-1', xp: 50000 }];
    const gridOpsRows: GridOpsStateRow[] = [
      {
        user_id: 'user-1',
        scenario_id: 'iberia_v1',
        turn_index: 0,
        deployed_asset_ids: ['control-center'],
        last_deployed_asset_id: null,
        spent_units: 0,
        scenario_seed: 1
      }
    ];

    createClientMock.mockReturnValue(makeSupabaseClient({ userProgressRows, gridOpsRows }));

    const response = await postAction({
      scenarioId: 'iberia_v1',
      actionType: 'deploy',
      assetId: 'battery-storage'
    });

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { errorCode: string };
    expect(payload.errorCode).toBe('locked_asset');
  });

  it('POST deploy rejects insufficient budget', async () => {
    const userProgressRows: UserProgressRow[] = [{ user_id: 'user-1', xp: 1000 }];
    const gridOpsRows: GridOpsStateRow[] = [
      {
        user_id: 'user-1',
        scenario_id: 'iberia_v1',
        turn_index: 0,
        deployed_asset_ids: ['control-center'],
        last_deployed_asset_id: null,
        spent_units: 0,
        scenario_seed: 1
      }
    ];

    createClientMock.mockReturnValue(makeSupabaseClient({ userProgressRows, gridOpsRows }));

    const response = await postAction({
      scenarioId: 'iberia_v1',
      actionType: 'deploy',
      assetId: 'smart-transformer'
    });

    expect(response.status).toBe(409);
    const payload = (await response.json()) as { errorCode: string };
    expect(payload.errorCode).toBe('insufficient_budget');
  });

  it('returns deterministic active event and milestone unlock payload after deploy', async () => {
    const userProgressRows: UserProgressRow[] = [{ user_id: 'user-1', xp: 30000 }];
    const gridOpsRows: GridOpsStateRow[] = [
      {
        user_id: 'user-1',
        scenario_id: 'iberia_v1',
        turn_index: 1,
        deployed_asset_ids: ['control-center', 'smart-transformer', 'solar-forecasting-array'],
        last_deployed_asset_id: 'solar-forecasting-array',
        spent_units: 5000,
        scenario_seed: 1
      }
    ];

    createClientMock.mockReturnValue(makeSupabaseClient({ userProgressRows, gridOpsRows }));

    const response = await postAction({
      scenarioId: 'iberia_v1',
      actionType: 'deploy',
      assetId: 'battery-storage'
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data: {
        active_event: { id: string };
        milestone_unlocked: { threshold: number } | null;
        next_best_action: { action: string };
      };
    };

    expect(payload.data.active_event.id).toBe('evening_peak');
    expect(payload.data.milestone_unlocked?.threshold).toBe(75);
    expect(payload.data.next_best_action.action.length).toBeGreaterThan(0);
  });
});
