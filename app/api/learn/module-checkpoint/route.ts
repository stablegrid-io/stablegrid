import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { isCheckpointPassing } from '@/lib/learn/moduleCheckpointGate';
import { createClient } from '@/lib/supabase/server';
import type { Topic } from '@/types/progress';

const TOPIC_SET = new Set<Topic>(['pyspark', 'fabric', 'airflow', 'sql', 'python-de']);
const isTopic = (value: string): value is Topic => TOPIC_SET.has(value as Topic);

interface CheckpointRow {
  module_id: string;
  passed: boolean;
  attempts: number;
  best_score: number;
  last_score: number;
  total_questions: number;
  updated_at: string;
}

const isValidModuleId = (topic: Topic, moduleId: string): boolean => {
  const doc = theoryDocs[topic];
  if (!doc) return false;
  const tracks = getTheoryTracks(doc);
  if (tracks.length > 0) {
    return tracks.some((track) => track.chapters.some((c) => c.id === moduleId));
  }
  return (doc.chapters ?? []).some((c) => c.id === moduleId);
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

  const url = new URL(request.url);
  const topic = url.searchParams.get('topic');
  if (!topic || !isTopic(topic)) {
    return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('module_checkpoints')
      .select('module_id,passed,attempts,best_score,last_score,total_questions,updated_at')
      .eq('user_id', user.id)
      .eq('topic', topic);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ data: (data ?? []) as CheckpointRow[] });
  } catch (error) {
    // Mirror module-progress GET: don't block reading on a progress fetch failure.
    console.warn(
      '[module-checkpoint GET] failed:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({
      data: [],
      warning: 'Checkpoint state temporarily unavailable.'
    });
  }
}

interface RecordPayload {
  topic: Topic;
  moduleId: string;
  correct: number;
  total: number;
}

const parseRecordPayload = async (request: Request): Promise<RecordPayload> => {
  const payload = await parseJsonObject(request);

  const action = payload.action;
  if (action !== 'record') {
    throw new ApiRouteError('Invalid action.', 400);
  }

  const topic = typeof payload.topic === 'string' ? payload.topic : null;
  if (!topic || !isTopic(topic)) {
    throw new ApiRouteError('Invalid topic.', 400);
  }

  const moduleId = typeof payload.moduleId === 'string' ? payload.moduleId.slice(0, 200) : null;
  if (!moduleId || !isValidModuleId(topic, moduleId)) {
    throw new ApiRouteError('Invalid module id.', 400);
  }

  const correct = Number(payload.correct);
  const total = Number(payload.total);
  if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0 || correct < 0 || correct > total) {
    throw new ApiRouteError('Invalid score.', 400);
  }

  return { topic, moduleId, correct, total };
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: RecordPayload;
  try {
    payload = await parseRecordPayload(request);
  } catch (error) {
    return toApiErrorResponse(error, 'Invalid checkpoint payload.');
  }

  try {
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'module_checkpoint_user',
        key: user.id,
        limit: 60,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'module_checkpoint_ip',
        key: clientIp,
        limit: 120,
        windowSeconds: 5 * 60
      })
    ]);

    const response = await runIdempotentJsonRequest({
      scope: 'module_checkpoint',
      ownerKey: user.id,
      idempotencyKey,
      requestBody: {
        action: 'record',
        topic: payload.topic,
        moduleId: payload.moduleId,
        correct: payload.correct,
        total: payload.total
      },
      execute: async () => {
        const score = payload.total > 0 ? payload.correct / payload.total : 0;
        const passing = isCheckpointPassing(payload.correct, payload.total);
        const nowIso = new Date().toISOString();

        const { data: existing, error: fetchError } = await supabase
          .from('module_checkpoints')
          .select('passed,attempts,best_score')
          .eq('user_id', user.id)
          .eq('topic', payload.topic)
          .eq('module_id', payload.moduleId)
          .maybeSingle<{ passed: boolean; attempts: number; best_score: number }>();

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        // `passed` is sticky: once true, stays true (matches client store).
        const previouslyPassed = Boolean(existing?.passed);
        const previousBest = Number(existing?.best_score ?? 0);
        const previousAttempts = Number(existing?.attempts ?? 0);

        const upsertRow = {
          user_id: user.id,
          topic: payload.topic,
          module_id: payload.moduleId,
          passed: previouslyPassed || passing,
          attempts: previousAttempts + 1,
          best_score: Math.max(previousBest, score),
          last_score: score,
          total_questions: payload.total,
          updated_at: nowIso
        };

        const { data: upserted, error: upsertError } = await supabase
          .from('module_checkpoints')
          .upsert(upsertRow, { onConflict: 'user_id,topic,module_id' })
          .select('module_id,passed,attempts,best_score,last_score,total_questions,updated_at')
          .single<CheckpointRow>();

        if (upsertError || !upserted) {
          throw new Error(upsertError?.message ?? 'Failed to record checkpoint.');
        }

        return {
          body: { data: upserted as unknown as Record<string, unknown> },
          status: 200
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record checkpoint result.');
  }
}
