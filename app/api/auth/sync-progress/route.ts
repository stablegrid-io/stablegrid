import { NextResponse } from 'next/server';
import { reconcileActivationTasksSafely } from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_DEPLOYED_NODE_IDS, INFRASTRUCTURE_BY_ID } from '@/lib/energy';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';

const INFRASTRUCTURE_NODE_ID_SET = new Set(Object.keys(INFRASTRUCTURE_BY_ID));
type JsonRecord = Record<string, unknown>;

const toRecord = (value: unknown): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
};

const sanitizeDeployedNodeIds = (value: unknown) => {
  if (!Array.isArray(value)) return null;

  const sanitized = value
    .filter((item): item is string => typeof item === 'string')
    .filter((item) => INFRASTRUCTURE_NODE_ID_SET.has(item));

  if (sanitized.length === 0) {
    return [...DEFAULT_DEPLOYED_NODE_IDS];
  }

  const deduped = Array.from(new Set(sanitized));
  if (!deduped.includes(DEFAULT_DEPLOYED_NODE_IDS[0])) {
    deduped.unshift(DEFAULT_DEPLOYED_NODE_IDS[0]);
  }

  return deduped;
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

  const [{ data, error }, { data: gridOpsState, error: gridOpsError }] =
    await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('grid_ops_state')
        .select('deployed_asset_ids,last_deployed_asset_id')
        .eq('user_id', user.id)
        .eq('scenario_id', GRID_OPS_DEFAULT_SCENARIO)
        .maybeSingle()
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (gridOpsError) {
    return NextResponse.json({ error: gridOpsError.message }, { status: 500 });
  }

  if (!data) {
    const { data: created, error: createError } = await supabase
      .from('user_progress')
      .insert({ user_id: user.id })
      .select('*')
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ data: created });
  }

  const resolvedData = gridOpsState
    ? {
        ...data,
        deployed_node_ids: gridOpsState.deployed_asset_ids,
        last_deployed_node_id: gridOpsState.last_deployed_asset_id
      }
    : data;

  return NextResponse.json({ data: resolvedData });
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

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const xp = Number(payload.xp ?? 0);
  const streak = Number(payload.streak ?? 0);
  const completedQuestions = Array.isArray(payload.completedQuestions)
    ? payload.completedQuestions
    : [];
  const incomingTopicProgress = toRecord(payload.topicProgress);
  const hasDeployedNodeIds = Object.prototype.hasOwnProperty.call(
    payload,
    'deployedNodeIds'
  );
  const hasLastDeployedNodeId = Object.prototype.hasOwnProperty.call(
    payload,
    'lastDeployedNodeId'
  );
  const deployedNodeIds = sanitizeDeployedNodeIds(payload.deployedNodeIds);
  const lastDeployedNodeIdRaw =
    typeof payload.lastDeployedNodeId === 'string' ? payload.lastDeployedNodeId : null;
  const lastDeployedNodeId =
    lastDeployedNodeIdRaw && deployedNodeIds?.includes(lastDeployedNodeIdRaw)
      ? lastDeployedNodeIdRaw
      : null;
  const { data: existingProgress, error: existingProgressError } = await supabase
    .from('user_progress')
    .select('topic_progress')
    .eq('user_id', user.id)
    .maybeSingle<{ topic_progress: JsonRecord | null }>();

  if (existingProgressError) {
    return NextResponse.json({ error: existingProgressError.message }, { status: 500 });
  }

  const topicProgress = {
    ...toRecord(existingProgress?.topic_progress),
    ...incomingTopicProgress
  };

  const updatePayload: Record<string, unknown> = {
    user_id: user.id,
    xp,
    streak,
    completed_questions: completedQuestions,
    topic_progress: topicProgress,
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (hasDeployedNodeIds && deployedNodeIds) {
    updatePayload.deployed_node_ids = deployedNodeIds;
  }
  if (hasLastDeployedNodeId) {
    updatePayload.last_deployed_node_id = lastDeployedNodeId;
  }

  const { error } = await supabase.from('user_progress').upsert(
    updatePayload,
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await reconcileActivationTasksSafely({ supabase, userId: user.id });

  return NextResponse.json({ success: true });
}
