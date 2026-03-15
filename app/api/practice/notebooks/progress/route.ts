import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { NOTEBOOKS } from '@/data/notebooks';
import { reconcileActivationTasksSafely } from '@/lib/activation/service';
import { createClient } from '@/lib/supabase/server';

type JsonRecord = Record<string, unknown>;

interface UserProgressTopicRow {
  topic_progress: JsonRecord | null;
}

const NOTEBOOK_ID_SET = new Set(NOTEBOOKS.map((notebook) => notebook.id));
const NOTEBOOK_ORDER_INDEX = new Map(
  NOTEBOOKS.map((notebook, index) => [notebook.id, index])
);

const toRecord = (value: unknown): JsonRecord => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as JsonRecord;
};

const toNumber = (value: unknown) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return numericValue;
};

const sanitizeCompletedNotebookIds = (value: unknown) => {
  if (!Array.isArray(value)) return [] as string[];

  const dedupedIds = Array.from(
    new Set(
      value.filter(
        (item): item is string =>
          typeof item === 'string' && NOTEBOOK_ID_SET.has(item)
      )
    )
  );

  dedupedIds.sort((left, right) => {
    const leftIndex = NOTEBOOK_ORDER_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = NOTEBOOK_ORDER_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });

  return dedupedIds;
};

const parseNotebookProgressPayload = async (request: Request) => {
  const payload = await parseJsonObject(request);

  if (!Array.isArray(payload.completedNotebookIds)) {
    throw new ApiRouteError('completedNotebookIds must be an array.', 400);
  }

  return {
    completedNotebookIds: sanitizeCompletedNotebookIds(payload.completedNotebookIds)
  };
};

const toNotebookProgressResponse = (topicProgress: JsonRecord) => {
  const notebooksProgress = toRecord(topicProgress.notebooks);
  const completedNotebookIds = sanitizeCompletedNotebookIds(
    notebooksProgress.completed_notebook_ids
  );
  const completedNotebooksCount = Math.max(
    completedNotebookIds.length,
    Math.min(
      NOTEBOOKS.length,
      Math.floor(toNumber(notebooksProgress.completed_notebooks_count))
    )
  );

  return {
    completedNotebookIds,
    completedNotebooksCount,
    notebooksTotal: NOTEBOOKS.length,
    updatedAt:
      typeof notebooksProgress.updated_at === 'string'
        ? notebooksProgress.updated_at
        : null
  };
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
    .from('user_progress')
    .select('topic_progress')
    .eq('user_id', user.id)
    .maybeSingle<UserProgressTopicRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: toNotebookProgressResponse(toRecord(data?.topic_progress))
  });
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
    const payload = await parseNotebookProgressPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'notebooks_progress_user',
        key: user.id,
        limit: 40,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'notebooks_progress_ip',
        key: clientIp,
        limit: 80,
        windowSeconds: 5 * 60
      })
    ]);

    const response = await runIdempotentJsonRequest({
      scope: 'notebooks_progress',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: payload,
      execute: async () => {
        const { data: existingData, error: existingError } = await supabase
          .from('user_progress')
          .select('topic_progress')
          .eq('user_id', user.id)
          .maybeSingle<UserProgressTopicRow>();

        if (existingError) {
          throw new ApiRouteError(existingError.message, 500);
        }

        const existingTopicProgress = toRecord(existingData?.topic_progress);
        const existingNotebooksProgress = toRecord(existingTopicProgress.notebooks);
        const now = new Date().toISOString();
        const nextTopicProgress: JsonRecord = {
          ...existingTopicProgress,
          notebooks: {
            ...existingNotebooksProgress,
            completed_notebook_ids: payload.completedNotebookIds,
            completed_notebooks_count: payload.completedNotebookIds.length,
            updated_at: now
          }
        };

        const { error } = await supabase.from('user_progress').upsert(
          {
            user_id: user.id,
            topic_progress: nextTopicProgress,
            last_activity: now,
            updated_at: now
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          throw new ApiRouteError(error.message, 500);
        }

        await reconcileActivationTasksSafely({ supabase, userId: user.id });

        return {
          body: {
            data: toNotebookProgressResponse(nextTopicProgress)
          },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to save notebook progress.');
  }
}
