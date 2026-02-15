import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  return NextResponse.json({ data });
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
  const topicProgress =
    typeof payload.topicProgress === 'object' && payload.topicProgress !== null
      ? payload.topicProgress
      : {};

  const { error } = await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      xp,
      streak,
      completed_questions: completedQuestions,
      topic_progress: topicProgress,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
