import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [
    profile,
    topicProgress,
    readingSessions,
    practiceSessions,
    functionViews,
    userProgress,
    subscriptions,
    cookieConsents
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('topic_progress').select('*').eq('user_id', user.id),
    supabase.from('reading_sessions').select('*').eq('user_id', user.id),
    supabase.from('practice_sessions').select('*').eq('user_id', user.id),
    supabase.from('function_views').select('*').eq('user_id', user.id),
    supabase.from('user_progress').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('cookie_consents').select('*').eq('user_id', user.id).maybeSingle()
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email
    },
    profile: profile.data ?? null,
    topic_progress: topicProgress.data ?? [],
    reading_sessions: readingSessions.data ?? [],
    practice_sessions: practiceSessions.data ?? [],
    function_views: functionViews.data ?? [],
    user_progress: userProgress.data ?? null,
    subscription: subscriptions.data ?? null,
    cookie_consents: cookieConsents.data ?? null
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="stablegrid-export-${user.id}.json"`
    }
  });
}
