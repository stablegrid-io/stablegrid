import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { theoryDocs } from '@/data/learn/theory';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';
import { MIN_LESSON_READ_SECONDS } from '@/lib/learn/lessonReadProgress';
import { createClient } from '@/lib/supabase/server';
import type { Topic } from '@/types/progress';

interface SeedPayload {
  topic?: string;
  moduleId?: string;
}

const TOPIC_SET = new Set<Topic>(['pyspark', 'fabric', 'airflow']);

const isTopic = (value: string): value is Topic => TOPIC_SET.has(value as Topic);

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  if (process.env.ALLOW_E2E_USER_CREATION !== 'true') {
    return NextResponse.json({ error: 'E2E seeding is disabled.' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: SeedPayload = {};
  try {
    payload = (await request.json()) as SeedPayload;
  } catch {
    payload = {};
  }

  const topic = typeof payload.topic === 'string' && isTopic(payload.topic)
    ? payload.topic
    : 'pyspark';
  const moduleId =
    typeof payload.moduleId === 'string' ? payload.moduleId : 'module-01';

  const doc = theoryDocs[topic];
  if (!doc) {
    return NextResponse.json({ error: 'Invalid topic.' }, { status: 400 });
  }

  const selectedModule = sortModulesByOrder(doc.modules).find(
    (entry) => entry.id === moduleId
  );
  if (!selectedModule) {
    return NextResponse.json({ error: 'Invalid module id.' }, { status: 400 });
  }

  const lessonIds = selectedModule.sections.map((section) => section.id);
  if (lessonIds.length === 0) {
    return NextResponse.json({ error: 'Module has no lessons.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Missing Supabase service role configuration.' },
      { status: 500 }
    );
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const nowIso = new Date().toISOString();
  const lessonSecondsById = Object.fromEntries(
    lessonIds.map((lessonId) => [lessonId, MIN_LESSON_READ_SECONDS])
  );
  const lastLessonId = lessonIds[lessonIds.length - 1] ?? null;

  const { error: seedError } = await adminClient.from('reading_sessions').upsert(
    {
      user_id: user.id,
      topic,
      chapter_id: selectedModule.id,
      chapter_number: selectedModule.order ?? selectedModule.number,
      started_at: nowIso,
      last_active_at: nowIso,
      completed_at: null,
      sections_total: lessonIds.length,
      sections_read: lessonIds.length,
      sections_ids_read: lessonIds,
      completed_lesson_ids: lessonIds,
      lesson_seconds_by_id: lessonSecondsById,
      active_seconds: lessonIds.length * MIN_LESSON_READ_SECONDS,
      current_lesson_id: lastLessonId,
      last_visited_route: lastLessonId
        ? `/learn/${topic}/theory/all?chapter=${selectedModule.id}&lesson=${lastLessonId}`
        : null,
      is_completed: false
    },
    { onConflict: 'user_id,topic,chapter_id' }
  );

  if (seedError) {
    return NextResponse.json({ error: seedError.message }, { status: 500 });
  }

  return NextResponse.json({
    topic,
    moduleId: selectedModule.id,
    lessonsRead: lessonIds.length
  });
}
