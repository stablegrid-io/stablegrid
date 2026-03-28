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
    enforceRateLimit({ scope: 'gdpr_delete_reason_user', key: user.id, limit: 10, windowSeconds: 3600 }),
    enforceRateLimit({ scope: 'gdpr_delete_reason_ip', key: getClientIp(request), limit: 20, windowSeconds: 3600 }),
  ]);

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
