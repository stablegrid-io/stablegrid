import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const pickOAuthAvatar = (
  metadata: Record<string, unknown> | null | undefined,
): string | null => {
  if (!metadata) return null;
  const candidates = [metadata.avatar_url, metadata.picture];
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
    .from('profiles')
    .select('avatar_url,name')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load avatar.' }, { status: 500 });
  }

  let avatarUrl =
    typeof data?.avatar_url === 'string' && data.avatar_url.trim().length > 0
      ? data.avatar_url
      : null;

  // Lazy backfill — users who signed in via OAuth before this feature
  // shipped have a non-null `user_metadata.avatar_url` but a null
  // `profiles.avatar_url`. Copy it over on first read so they don't have
  // to log out + back in. Decorative, so failures are silent.
  if (!avatarUrl) {
    const oauthAvatar = pickOAuthAvatar(
      user.user_metadata as Record<string, unknown> | null,
    );
    if (oauthAvatar) {
      try {
        await supabase
          .from('profiles')
          .update({ avatar_url: oauthAvatar })
          .eq('id', user.id);
        avatarUrl = oauthAvatar;
      } catch {
        avatarUrl = oauthAvatar;
      }
    }
  }

  const fullName =
    typeof data?.name === 'string' && data.name.trim().length > 0
      ? data.name
      : null;

  return NextResponse.json({
    data: {
      avatarUrl,
      fullName
    }
  });
}
