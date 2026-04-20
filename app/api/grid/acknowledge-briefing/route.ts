import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  await supabase
    .from('user_grid_state')
    .upsert({ user_id: user.id, briefing_seen: true }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
