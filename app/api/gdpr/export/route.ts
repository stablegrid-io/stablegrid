import { NextResponse } from 'next/server';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Promise.all([
    enforceRateLimit({ scope: 'gdpr_export_user', key: user.id, limit: 5, windowSeconds: 3600 }),
    enforceRateLimit({ scope: 'gdpr_export_ip', key: getClientIp(request), limit: 10, windowSeconds: 3600 }),
  ]);

  const [
    profile,
    topicProgress,
    readingSessions,
    userProgress,
    subscriptions,
    cookieConsents
  ] = await Promise.all([
    supabase.from('profiles').select('id,name,email,avatar_url,created_at').eq('id', user.id).maybeSingle(),
    supabase.from('topic_progress').select('topic,theory_chapters_completed,theory_sections_read,theory_total_minutes_read,practice_questions_attempted,practice_questions_correct,overall_completion_pct,first_activity_at,last_activity_at').eq('user_id', user.id),
    supabase.from('reading_sessions').select('topic,chapter_id,started_at,last_active_at,completed_at,sections_total,sections_read,is_completed,active_seconds').eq('user_id', user.id),
    supabase.from('user_progress').select('xp,streak,last_activity,updated_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('subscriptions').select('status,plan_id,current_period_start,current_period_end,cancel_at_period_end,created_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('cookie_consents').select('consent,source,updated_at').eq('user_id', user.id).maybeSingle()
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
