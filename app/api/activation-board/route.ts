import { NextResponse } from 'next/server';
import { getActivationBoardData } from '@/lib/activation/service';
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
