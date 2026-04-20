import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });

  const [xpRes, spentRes] = await Promise.all([
    supabase.from('user_progress').select('xp').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_grid_purchases').select('cost_paid').eq('user_id', user.id),
  ]);

  const xp = (xpRes.data?.xp as number | undefined) ?? 0;
  const spent = (spentRes.data ?? []).reduce(
    (s, r: { cost_paid: number | null }) => s + (r.cost_paid ?? 0),
    0,
  );
  return NextResponse.json({ balance: Math.max(0, xp - spent), earned: xp, spent });
}
