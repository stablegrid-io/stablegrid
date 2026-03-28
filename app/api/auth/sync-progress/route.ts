import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
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

const sanitizeCompletedQuestions = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (item): item is number | string =>
          typeof item === 'number' || typeof item === 'string'
      )
    : [];

interface SyncProgressPayload {
  completedQuestions: Array<number | string>;
  deployedNodeIds: string[] | null;
  hasDeployedNodeIds: boolean;
  hasLastDeployedNodeId: boolean;
  lastDeployedNodeId: string | null;
  streak: number;
  topicProgress: JsonRecord;
  xp: number;
}

const parseSyncProgressPayload = async (request: Request): Promise<SyncProgressPayload> => {
  const payload = await parseJsonObject(request);

  const xp = Number(payload.xp ?? 0);
  const streak = Number(payload.streak ?? 0);

  if (!Number.isFinite(xp) || xp < 0) {
    throw new ApiRouteError('xp must be a non-negative number.', 400);
  }

  if (!Number.isFinite(streak) || streak < 0) {
    throw new ApiRouteError('streak must be a non-negative number.', 400);
  }

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

  return {
    completedQuestions: sanitizeCompletedQuestions(payload.completedQuestions),
    deployedNodeIds,
    hasDeployedNodeIds,
    hasLastDeployedNodeId,
    lastDeployedNodeId,
    streak,
    topicProgress: toRecord(payload.topicProgress),
    xp
  };
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

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await Promise.all([
      enforceRateLimit({
        scope: 'sync_progress_get_user',
        key: user.id,
        limit: 60,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'sync_progress_get_ip',
        key: getClientIp(request),
        limit: 120,
        windowSeconds: 5 * 60
      })
    ]);

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
      throw new Error(error.message);
    }

    if (gridOpsError) {
      throw new Error(gridOpsError.message);
    }

    if (!data) {
      const { data: created, error: createError } = await supabase
        .from('user_progress')
        .upsert({ user_id: user.id }, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (createError) {
        throw new Error(createError.message);
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
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to fetch synced progress.');
  }
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
    const payload = await parseSyncProgressPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'sync_progress_post_user',
        key: user.id,
        limit: 30,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'sync_progress_post_ip',
        key: clientIp,
        limit: 60,
        windowSeconds: 5 * 60
      })
    ]);

    const response = await runIdempotentJsonRequest({
      scope: 'sync_progress',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: {
        xp: payload.xp,
        streak: payload.streak,
        completedQuestions: payload.completedQuestions,
        deployedNodeIds: payload.deployedNodeIds,
        lastDeployedNodeId: payload.lastDeployedNodeId,
        topicProgress: payload.topicProgress
      },
      execute: async () => {
        const { data: existingProgress, error: existingProgressError } = await supabase
          .from('user_progress')
          .select('topic_progress')
          .eq('user_id', user.id)
          .maybeSingle<{ topic_progress: JsonRecord | null }>();

        if (existingProgressError) {
          throw new Error(existingProgressError.message);
        }

        const topicProgress = {
          ...toRecord(existingProgress?.topic_progress),
          ...payload.topicProgress
        };

        const updatePayload: Record<string, unknown> = {
          user_id: user.id,
          xp: payload.xp,
          streak: payload.streak,
          completed_questions: payload.completedQuestions,
          topic_progress: topicProgress,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (payload.hasDeployedNodeIds && payload.deployedNodeIds) {
          updatePayload.deployed_node_ids = payload.deployedNodeIds;
        }
        if (payload.hasLastDeployedNodeId) {
          updatePayload.last_deployed_node_id = payload.lastDeployedNodeId;
        }

        const { error } = await supabase.from('user_progress').upsert(updatePayload, {
          onConflict: 'user_id'
        });

        if (error) {
          throw new Error(error.message);
        }

        await reconcileActivationTasksSafely({ supabase, userId: user.id });

        return {
          body: { success: true },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to save synced progress.');
  }
}
