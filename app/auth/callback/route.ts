import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If caller explicitly specified a destination, honour it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise detect first-time users and send them to onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progress } = await supabase
          .from('topic_progress')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        const isNewUser = !progress;
        return NextResponse.redirect(`${origin}${isNewUser ? '/onboarding' : '/'}`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
