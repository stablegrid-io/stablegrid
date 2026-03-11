import { NextResponse } from 'next/server';
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

  let payload: { completedNotebookIds?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!Array.isArray(payload.completedNotebookIds)) {
    return NextResponse.json(
      { error: 'completedNotebookIds must be an array.' },
      { status: 400 }
    );
  }

  const completedNotebookIds = sanitizeCompletedNotebookIds(
    payload.completedNotebookIds
  );

  const { data: existingData, error: existingError } = await supabase
    .from('user_progress')
    .select('topic_progress')
    .eq('user_id', user.id)
    .maybeSingle<UserProgressTopicRow>();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingTopicProgress = toRecord(existingData?.topic_progress);
  const existingNotebooksProgress = toRecord(existingTopicProgress.notebooks);
  const now = new Date().toISOString();
  const nextTopicProgress: JsonRecord = {
    ...existingTopicProgress,
    notebooks: {
      ...existingNotebooksProgress,
      completed_notebook_ids: completedNotebookIds,
      completed_notebooks_count: completedNotebookIds.length,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await reconcileActivationTasksSafely({ supabase, userId: user.id });

  return NextResponse.json({
    data: toNotebookProgressResponse(nextTopicProgress)
  });
}
