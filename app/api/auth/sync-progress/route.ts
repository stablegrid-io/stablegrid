import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

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

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
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

    return NextResponse.json({ data });
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
        const { data: existingProgress, error: existingProgressError } = await supabase
          .from('user_progress')
          .select('topic_progress,xp,streak')
          .eq('user_id', user.id)
          .maybeSingle<{ topic_progress: JsonRecord | null; xp: number | null; streak: number | null }>();

        if (existingProgressError) {
          throw new Error(existingProgressError.message);
        }

        // Server-side XP/streak validation: only allow bounded increases per sync
        // Prevents client-side manipulation of raw XP/streak values
        const existingXp = Math.max(0, Number(existingProgress?.xp ?? 0));
        const existingStreak = Math.max(0, Number(existingProgress?.streak ?? 0));
        const MAX_XP_INCREASE_PER_SYNC = 500;
        const MAX_STREAK = 365;
        const safeXp = Math.max(existingXp, Math.min(payload.xp, existingXp + MAX_XP_INCREASE_PER_SYNC));
        const safeStreak = Math.min(Math.max(payload.streak, 0), MAX_STREAK);

        const topicProgress = {
          ...toRecord(existingProgress?.topic_progress),
          ...payload.topicProgress
        };

        const updatePayload: Record<string, unknown> = {
          user_id: user.id,
          xp: safeXp,
          streak: safeStreak,
          completed_questions: payload.completedQuestions,
          topic_progress: topicProgress,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('user_progress').upsert(updatePayload, {
          onConflict: 'user_id'
        });

        if (error) {
          throw new Error(error.message);
        }

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
