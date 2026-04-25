import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGridState } from '@/lib/grid/state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    const payload = await fetchGridState(supabase, user.id);
    return NextResponse.json(payload);
  } catch (err) {
    console.error('[grid/state] failed', err);
    return NextResponse.json({ error: 'INTERNAL' }, { status: 500 });
  }
}
