import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const ALLOWED = new Set([
  'grid_page_viewed',
  'grid_briefing_acknowledged',
  'grid_component_deployed',
  'grid_purchase_rejected',
  'grid_restored',
]);

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const type = typeof body.type === 'string' ? body.type : '';
  if (!ALLOWED.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

  const { type: _type, ...metadata } = body;
  await supabase.from('product_funnel_events').insert({
    session_id: (req.headers.get('x-session-id') ?? user?.id ?? '').slice(0, 64) || 'anon_grid__',
    user_id: user?.id ?? null,
    event_name: type,
    path: '/grid',
    metadata,
  });

  return NextResponse.json({ ok: true });
}
