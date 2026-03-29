import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const buildIso = () => new Date().toISOString();

export async function POST() {
  if (process.env.NODE_ENV === 'production' || process.env.ALLOW_E2E_USER_CREATION !== 'true') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }
  if (process.env.ALLOW_E2E_USER_CREATION !== 'true') {
    return NextResponse.json(
      { error: 'E2E user creation is disabled. Set ALLOW_E2E_USER_CREATION=true to enable.' },
      { status: 403 }
    );
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

  const stamp = Date.now();
  const nowIso = buildIso();
  const email = `codex-home-${stamp}@stablegrid.test`;
  const password = 'CodexPass9!';

  const { data: createdUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Operator QA'
      }
    });

  if (createError || !createdUser.user) {
    return NextResponse.json(
      { error: createError?.message ?? 'Failed to create E2E user.' },
      { status: 500 }
    );
  }

  const userId = createdUser.user.id;

  const { error: progressError } = await adminClient.from('user_progress').upsert(
    {
      user_id: userId,
      xp: 138000,
      streak: 6,
      completed_questions: ['py-q-01', 'py-q-02', 'py-q-03', 'fabric-q-01'],
      topic_progress: {
        pyspark: {
          correct: 9,
          total: 12,
          lastAttempted: nowIso
        },
        fabric: {
          correct: 4,
          total: 6,
          lastAttempted: nowIso
        }
      },
      deployed_node_ids: ['control-center', 'smart-transformer'],
      last_deployed_node_id: 'smart-transformer',
      last_activity: nowIso,
      updated_at: nowIso
    },
    { onConflict: 'user_id' }
  );

  if (progressError) {
    return NextResponse.json({ error: progressError.message }, { status: 500 });
  }

  const { error: topicProgressError } = await adminClient.from('topic_progress').upsert(
    [
      {
        user_id: userId,
        topic: 'pyspark',
        theory_chapters_total: 10,
        theory_chapters_completed: 6,
        theory_sections_total: 48,
        theory_sections_read: 29,
        theory_total_minutes_read: 92,
        practice_questions_total: 40,
        practice_questions_attempted: 12,
        practice_questions_correct: 9,
        functions_total: 0,
        functions_viewed: 0,
        functions_bookmarked: 0,
        overall_completion_pct: 53,
        first_activity_at: nowIso,
        last_activity_at: nowIso,
        updated_at: nowIso
      },
      {
        user_id: userId,
        topic: 'fabric',
        theory_chapters_total: 8,
        theory_chapters_completed: 2,
        theory_sections_total: 34,
        theory_sections_read: 8,
        theory_total_minutes_read: 28,
        practice_questions_total: 30,
        practice_questions_attempted: 6,
        practice_questions_correct: 4,
        functions_total: 0,
        functions_viewed: 0,
        functions_bookmarked: 0,
        overall_completion_pct: 21,
        first_activity_at: nowIso,
        last_activity_at: nowIso,
        updated_at: nowIso
      }
    ],
    { onConflict: 'user_id,topic' }
  );

  if (topicProgressError) {
    return NextResponse.json({ error: topicProgressError.message }, { status: 500 });
  }

  const { error: readingSessionError } = await adminClient
    .from('reading_sessions')
    .upsert(
      {
        user_id: userId,
        topic: 'pyspark',
        chapter_id: 'module-01',
        chapter_number: 1,
        started_at: nowIso,
        last_active_at: nowIso,
        completed_at: null,
        sections_total: 6,
        sections_read: 3,
        sections_ids_read: [
          'module-01-lesson-01',
          'module-01-lesson-02',
          'module-01-lesson-03'
        ],
        completed_lesson_ids: [
          'module-01-lesson-01',
          'module-01-lesson-02',
          'module-01-lesson-03'
        ],
        lesson_seconds_by_id: {
          'module-01-lesson-01': 240,
          'module-01-lesson-02': 220,
          'module-01-lesson-03': 180
        },
        active_seconds: 640,
        current_lesson_id: 'module-01-lesson-04',
        last_visited_route:
          '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-04',
        is_completed: false
      },
      { onConflict: 'user_id,topic,chapter_id' }
    );

  if (readingSessionError) {
    return NextResponse.json({ error: readingSessionError.message }, { status: 500 });
  }

  return NextResponse.json({
    email,
    password,
    userId
  });
}
