import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';
import { computeSafeXpAndStreak } from '@/lib/api/syncProgressValidation';
import { deriveCompletedTracks } from '@/lib/tiers';

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

  return {
    completedQuestions: sanitizeCompletedQuestions(payload.completedQuestions),
    streak,
    topicProgress: toRecord(payload.topicProgress),
    xp
  };
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

    const [progressResult, modulesResult] = await Promise.all([
      supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      // Completed modules feed the track-level tier requirements in lib/tiers.ts.
      // We only care about the ids here — the completion-count-per-track is
      // derived client-side by deriveCompletedTracks().
      supabase
        .from('module_progress')
        .select('module_id')
        .eq('user_id', user.id)
        .eq('is_completed', true)
    ]);

    if (progressResult.error) {
      throw new Error(progressResult.error.message);
    }

    const completedModuleIds = (modulesResult.data ?? [])
      .map((row) => row.module_id)
      .filter((id): id is string => typeof id === 'string');
    const completedTracks = deriveCompletedTracks(completedModuleIds);

    if (!progressResult.data) {
      const { data: created, error: createError } = await supabase
        .from('user_progress')
        .upsert({ user_id: user.id }, { onConflict: 'user_id' })
        .select('*')
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      return NextResponse.json({
        data: { ...created, completed_tracks: completedTracks }
      });
    }

    return NextResponse.json({
      data: { ...progressResult.data, completed_tracks: completedTracks }
    });
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
        topicProgress: payload.topicProgress
      },
      execute: async () => {
        // Atomic read-then-write via Supabase RPC to prevent TOCTOU race conditions.
        // Falls back to the original SELECT+UPSERT pattern if the RPC doesn't exist yet.
        const nowIso = new Date().toISOString();

        const { data: rpcResult, error: rpcError } = await supabase.rpc(
          'sync_user_progress',
          {
            p_user_id: user.id,
            p_client_xp: payload.xp,
            p_client_streak: payload.streak,
            p_max_xp_increase: 500,
            p_max_streak: 365,
            p_completed_questions: payload.completedQuestions,
            p_topic_progress: payload.topicProgress,
            p_now: nowIso,
          },
        );

        if (!rpcError) {
          return { body: { success: true, atomic: true }, status: 200 };
        }

        // Fall back to SELECT + UPSERT when the RPC is missing (42883), the signature
        // drifted from this handler (mentions sync_user_progress in the error), or the
        // body has a datatype mismatch (42804). Without the 42804 branch a schema/type
        // regression on the RPC would silently drop every progress save — see
        // migration 20260424210000 for the incident that motivated this.
        if (
          rpcError.message.includes('sync_user_progress')
          || rpcError.code === '42883'
          || rpcError.code === '42804'
        ) {
          const { data: existingProgress, error: existingProgressError } = await supabase
            .from('user_progress')
            .select('topic_progress,xp,streak')
            .eq('user_id', user.id)
            .maybeSingle<{ topic_progress: JsonRecord | null; xp: number | null; streak: number | null }>();

          if (existingProgressError) {
            throw new Error(existingProgressError.message);
          }

          const existingXp = Math.max(0, Number(existingProgress?.xp ?? 0));
          const existingStreak = Math.max(0, Number(existingProgress?.streak ?? 0));
          const { safeXp, safeStreak } = computeSafeXpAndStreak(
            existingXp, existingStreak, payload.xp, payload.streak,
          );

          const topicProgress = {
            ...toRecord(existingProgress?.topic_progress),
            ...payload.topicProgress
          };

          const { error } = await supabase.from('user_progress').upsert(
            {
              user_id: user.id,
              xp: safeXp,
              streak: safeStreak,
              completed_questions: payload.completedQuestions,
              topic_progress: topicProgress,
              last_activity: nowIso,
              updated_at: nowIso,
            },
            { onConflict: 'user_id' },
          );

          if (error) {
            throw new Error(error.message);
          }

          return { body: { success: true, atomic: false }, status: 200 };
        }

        throw new Error(rpcError.message);
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to save synced progress.');
  }
}
