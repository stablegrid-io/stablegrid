import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const pickOAuthAvatar = (user: User): string | null => {
  const meta = user.user_metadata as Record<string, unknown> | null | undefined;
  if (!meta) return null;
  const candidates = [meta.avatar_url, meta.picture];
  for (const candidate of candidates) {
    if (
      typeof candidate === 'string' &&
      candidate.trim().length > 0 &&
      !candidate.startsWith('data:')
    ) {
      return candidate.trim();
    }
  }
  return null;
};

const syncOAuthAvatar = async (
  supabase: SupabaseClient,
  user: User,
): Promise<void> => {
  const oauthAvatar = pickOAuthAvatar(user);
  if (!oauthAvatar) return;
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle<{ avatar_url: string | null }>();

    const hasAvatar =
      typeof existing?.avatar_url === 'string' &&
      existing.avatar_url.trim().length > 0;
    if (hasAvatar) return;

    await supabase
      .from('profiles')
      .update({ avatar_url: oauthAvatar })
      .eq('id', user.id);
  } catch (error) {
    // Avatar sync is decorative — never block sign-in on it.
    console.warn('[auth/callback] avatar sync failed:', error);
  }
};

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If caller explicitly specified a destination, honour it —
      // but only allow relative paths starting with / (no protocol-relative //evil.com)
      if (next && /^\/[a-zA-Z0-9]/.test(next)) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise detect first-time users and send them to onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Snapshot the OAuth avatar into `profiles.avatar_url` if the user
        // hasn't set one yet. Google puts it on `picture`; GitHub on
        // `avatar_url`. Fire-and-forget — login must succeed even if this
        // sync fails, since the avatar is decorative.
        void syncOAuthAvatar(supabase, user);

        const { data: progress } = await supabase
          .from('topic_progress')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        const isNewUser = !progress;
        const destination = isNewUser ? '/onboarding?signup=1&method=oauth' : '/';
        return NextResponse.redirect(`${origin}${destination}`);
      }

      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
