import { NextResponse } from 'next/server';
import { MISSIONS } from '@/data/missions';
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

  let payload: {
    missionSlug?: string;
    state?: MissionState;
    unlocked?: boolean;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const missionSlug = payload.missionSlug?.trim();
  const state = payload.state;
  const unlocked =
    typeof payload.unlocked === 'boolean' ? payload.unlocked : undefined;

  if (!missionSlug || !missionSlugSet.has(missionSlug)) {
    return NextResponse.json({ error: 'Invalid mission slug.' }, { status: 400 });
  }

  if (!state || !['not_started', 'in_progress', 'completed'].includes(state)) {
    return NextResponse.json({ error: 'Invalid mission state.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  let rewardAwardedUnits = 0;
  const updatePayload: Record<string, unknown> = {
    user_id: user.id,
    mission_slug: missionSlug,
    state,
    updated_at: now
  };

  if (typeof unlocked === 'boolean') {
    updatePayload.unlocked = unlocked;
  } else if (state !== 'not_started') {
    updatePayload.unlocked = true;
  }

  if (state === 'in_progress') {
    updatePayload.started_at = now;
    updatePayload.completed_at = null;
  }

  if (state === 'completed') {
    const { data: existingProgress } = await supabase
      .from('user_missions')
      .select('xp_awarded')
      .eq('user_id', user.id)
      .eq('mission_slug', missionSlug)
      .maybeSingle<{ xp_awarded: number | null }>();

    const existingReward = Number(existingProgress?.xp_awarded ?? 0);
    if (existingReward <= 0) {
      const rewardUnits = missionRewardBySlug.get(missionSlug) ?? 0;
      if (rewardUnits > 0) {
        updatePayload.xp_awarded = rewardUnits;
        rewardAwardedUnits = rewardUnits;
      }
    }
    updatePayload.completed_at = now;
    updatePayload.started_at = now;
  }

  if (state === 'not_started') {
    updatePayload.started_at = null;
    updatePayload.completed_at = null;
  }

  const { data, error } = await supabase
    .from('user_missions')
    .upsert(updatePayload, { onConflict: 'user_id,mission_slug' })
    .select('mission_slug,state,unlocked,started_at,completed_at,xp_awarded')
    .single<UserMissionRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    reward_awarded_units: rewardAwardedUnits
  });
}
