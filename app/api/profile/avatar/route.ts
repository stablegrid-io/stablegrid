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
    .from('profiles')
    .select('avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Failed to load avatar.' }, { status: 500 });
  }

  const avatarUrl =
    typeof data?.avatar_url === 'string' && data.avatar_url.trim().length > 0
      ? data.avatar_url
      : null;

  return NextResponse.json({
    data: {
      avatarUrl
    }
  });
}
