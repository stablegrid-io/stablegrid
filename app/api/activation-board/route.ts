import { NextResponse } from 'next/server';
import { getActivationBoardData } from '@/lib/activation/service';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await Promise.all([
    enforceRateLimit({ scope: 'activation_board_user', key: user.id, limit: 30, windowSeconds: 300 }),
    enforceRateLimit({ scope: 'activation_board_ip', key: getClientIp(request), limit: 60, windowSeconds: 300 }),
  ]);

  try {
    const data = await getActivationBoardData({
      supabase,
      userId: user.id,
      shouldReconcile: true
    });

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch activation board.'
      },
      { status: 500 }
    );
  }
}
