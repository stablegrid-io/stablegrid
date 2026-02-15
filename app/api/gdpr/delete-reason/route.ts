import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let reason = 'unspecified';
  try {
    const payload = (await request.json()) as { reason?: string };
    if (payload.reason && payload.reason.trim()) {
      reason = payload.reason.trim().slice(0, 200);
    }
  } catch {
    // Ignore parsing errors and store fallback reason.
  }

  const { error } = await supabase.from('account_deletion_reasons').insert({
    user_id: user.id,
    reason,
    created_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logged: true });
}
