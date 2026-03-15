import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createApiProtectionAdminClient,
  createApiProtectionAdminState
} from './support/apiProtectionAdmin';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();
const reconcileActivationTasksSafelyMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

vi.mock('@/lib/activation/service', () => ({
  reconcileActivationTasksSafely: reconcileActivationTasksSafelyMock
}));

interface UserMissionRow {
  completed_at: string | null;
  mission_slug: string;
  started_at: string | null;
  state: 'not_started' | 'in_progress' | 'completed';
  unlocked: boolean;
  user_id: string;
  xp_awarded: number;
}

interface MissionState {
  rewardLookupCount: number;
  rows: UserMissionRow[];
  upsertCount: number;
}

const createMissionClient = (state: MissionState) => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: {
        user: {
          id: 'user-1'
        }
      },
      error: null
    }))
  },
  from: vi.fn((table: string) => {
    if (table !== 'user_missions') {
      throw new Error(`Unexpected table: ${table}`);
    }

    return {
      select: vi.fn((columns: string) => {
        if (columns !== 'xp_awarded') {
          throw new Error(`Unexpected select columns: ${columns}`);
        }

        const filters: Record<string, string> = {};
        const chain: any = {};

        chain.eq = vi.fn((column: string, value: string) => {
          filters[column] = value;
          return chain;
        });
        chain.maybeSingle = vi.fn(async () => {
          state.rewardLookupCount += 1;
          const row =
            state.rows.find(
              (candidate) =>
                candidate.user_id === filters.user_id &&
                candidate.mission_slug === filters.mission_slug
            ) ?? null;

          return {
            data: row ? { xp_awarded: row.xp_awarded } : null,
            error: null
          };
        });

        return chain;
      }),
      upsert: vi.fn((payload: Record<string, unknown>) => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => {
            state.upsertCount += 1;

            const nextRow: UserMissionRow = {
              completed_at: (payload.completed_at as string | null | undefined) ?? null,
              mission_slug: payload.mission_slug as string,
              started_at: (payload.started_at as string | null | undefined) ?? null,
              state: payload.state as UserMissionRow['state'],
              unlocked: Boolean(payload.unlocked),
              user_id: payload.user_id as string,
              xp_awarded: Number(payload.xp_awarded ?? 0)
            };

            const existingIndex = state.rows.findIndex(
              (candidate) =>
                candidate.user_id === nextRow.user_id &&
                candidate.mission_slug === nextRow.mission_slug
            );

            if (existingIndex >= 0) {
              state.rows[existingIndex] = nextRow;
            } else {
              state.rows.push(nextRow);
            }

            return {
              data: nextRow,
              error: null
            };
          })
        }))
      }))
    };
  })
});

const makeRequest = (idempotencyKey: string) =>
  new Request('http://localhost/api/missions/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
      'x-forwarded-for': '203.0.113.10'
    },
    body: JSON.stringify({
      missionSlug: 'ghost-regulator',
      state: 'completed',
      unlocked: true
    })
  });

describe('missions progress route', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    reconcileActivationTasksSafelyMock.mockReset();
    reconcileActivationTasksSafelyMock.mockResolvedValue(undefined);
  });

  it('replays the first completion response for duplicate idempotency keys', async () => {
    const adminState = createApiProtectionAdminState();
    const missionState: MissionState = {
      rewardLookupCount: 0,
      rows: [],
      upsertCount: 0
    };

    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    createClientMock.mockReturnValue(createMissionClient(missionState));

    const { POST } = await import('@/app/api/missions/progress/route');

    const firstResponse = await POST(makeRequest('mission-progress-key-1234'));
    const secondResponse = await POST(makeRequest('mission-progress-key-1234'));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);

    const firstPayload = (await firstResponse.json()) as {
      data: UserMissionRow;
      reward_awarded_units: number;
    };
    const secondPayload = (await secondResponse.json()) as {
      data: UserMissionRow;
      reward_awarded_units: number;
    };

    expect(firstPayload).toEqual(secondPayload);
    expect(firstPayload.reward_awarded_units).toBe(1400);
    expect(firstPayload.data).toMatchObject({
      mission_slug: 'ghost-regulator',
      state: 'completed',
      unlocked: true,
      xp_awarded: 1400
    });
    expect(missionState.upsertCount).toBe(1);
    expect(missionState.rewardLookupCount).toBe(1);
    expect(reconcileActivationTasksSafelyMock).toHaveBeenCalledTimes(1);
  });
});
