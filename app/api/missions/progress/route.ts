import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { MISSIONS } from '@/data/missions';
import { reconcileActivationTasksSafely } from '@/lib/activation/service';
import { getMissionRewardUnits } from '@/lib/energy';
import { createClient } from '@/lib/supabase/server';
import type { MissionState } from '@/types/missions';

const missionSlugSet = new Set(MISSIONS.map((mission) => mission.slug));
const missionRewardBySlug = new Map(
  MISSIONS.map((mission) => [mission.slug, getMissionRewardUnits(mission.difficulty)])
);

interface UserMissionRow {
  mission_slug: string;
  state: MissionState;
  unlocked: boolean;
  started_at: string | null;
  completed_at: string | null;
  xp_awarded: number;
}

const isMissionState = (value: unknown): value is MissionState =>
  value === 'not_started' || value === 'in_progress' || value === 'completed';

interface MissionProgressPayload {
  missionSlug: string;
  state: MissionState;
  unlocked?: boolean;
}

const parseMissionProgressPayload = async (request: Request) => {
  const payload = await parseJsonObject(request);
  const missionSlug = typeof payload.missionSlug === 'string' ? payload.missionSlug.trim() : '';
  const state = payload.state;
  const unlocked =
    typeof payload.unlocked === 'boolean' ? payload.unlocked : undefined;

  if (!missionSlug || !missionSlugSet.has(missionSlug)) {
    throw new ApiRouteError('Invalid mission slug.', 400);
  }

  if (!isMissionState(state)) {
    throw new ApiRouteError('Invalid mission state.', 400);
  }

  return {
    missionSlug,
    state,
    unlocked
  } satisfies MissionProgressPayload;
};

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('user_missions')
    .select('mission_slug,state,unlocked,started_at,completed_at,xp_awarded')
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

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
    const payload = await parseMissionProgressPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'missions_progress_user',
        key: user.id,
        limit: 40,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'missions_progress_ip',
        key: clientIp,
        limit: 80,
        windowSeconds: 5 * 60
      })
    ]);

    const response = await runIdempotentJsonRequest({
      scope: 'missions_progress',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: payload,
      execute: async () => {
        const now = new Date().toISOString();
        let rewardAwardedUnits = 0;
        const updatePayload: Record<string, unknown> = {
          user_id: user.id,
          mission_slug: payload.missionSlug,
          state: payload.state,
          updated_at: now
        };

        if (typeof payload.unlocked === 'boolean') {
          updatePayload.unlocked = payload.unlocked;
        } else if (payload.state !== 'not_started') {
          updatePayload.unlocked = true;
        }

        if (payload.state === 'in_progress') {
          updatePayload.started_at = now;
          updatePayload.completed_at = null;
        }

        if (payload.state === 'completed') {
          const { data: existingProgress, error: existingError } = await supabase
            .from('user_missions')
            .select('xp_awarded')
            .eq('user_id', user.id)
            .eq('mission_slug', payload.missionSlug)
            .maybeSingle<{ xp_awarded: number | null }>();

          if (existingError) {
            throw new ApiRouteError(existingError.message, 500);
          }

          const existingReward = Number(existingProgress?.xp_awarded ?? 0);
          if (existingReward <= 0) {
            const rewardUnits = missionRewardBySlug.get(payload.missionSlug) ?? 0;
            if (rewardUnits > 0) {
              updatePayload.xp_awarded = rewardUnits;
              rewardAwardedUnits = rewardUnits;
            }
          }
          updatePayload.completed_at = now;
          updatePayload.started_at = now;
        }

        if (payload.state === 'not_started') {
          updatePayload.started_at = null;
          updatePayload.completed_at = null;
        }

        const { data, error } = await supabase
          .from('user_missions')
          .upsert(updatePayload, { onConflict: 'user_id,mission_slug' })
          .select('mission_slug,state,unlocked,started_at,completed_at,xp_awarded')
          .single<UserMissionRow>();

        if (error) {
          throw new ApiRouteError(error.message, 500);
        }

        await reconcileActivationTasksSafely({ supabase, userId: user.id });

        return {
          body: {
            data,
            reward_awarded_units: rewardAwardedUnits
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to update mission progress.');
  }
}
