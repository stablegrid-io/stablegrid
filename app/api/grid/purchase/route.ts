import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { ApiRouteError, toApiErrorResponse } from '@/lib/api/http';
import { GRID_COMPONENTS_BY_SLUG } from '@/lib/grid/components';
import { computeQuestView } from '@/lib/grid/quest';
import { fetchGridState } from '@/lib/grid/state';
import type { ComponentSlug, PurchaseErrorCode, PurchaseResponse } from '@/types/grid';

const KNOWN_ERRORS: ReadonlySet<PurchaseErrorCode> = new Set([
  'INSUFFICIENT_FUNDS',
  'ALREADY_OWNED',
  'GATE_NOT_MET',
  'UNKNOWN_COMPONENT',
  'UNAUTHENTICATED',
  'INTERNAL',
]);

const toErrorCode = (value: string | null): PurchaseErrorCode =>
  value && KNOWN_ERRORS.has(value as PurchaseErrorCode) ? (value as PurchaseErrorCode) : 'INTERNAL';

export const dynamic = 'force-dynamic';

interface RpcRow {
  ok: boolean;
  error_code: string | null;
  error_message: string | null;
  new_balance: number;
  items_owned: string[] | null;
  districts_restored: number;
  briefing_seen: boolean;
  first_deploy_at: string | null;
  last_deploy_at: string | null;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  try {
    await enforceRateLimit({
      scope: 'grid_purchase',
      key: `user:${user.id}:${getClientIp(req)}`,
      limit: 10,
      windowSeconds: 60,
    });
  } catch (err) {
    if (err instanceof ApiRouteError) return toApiErrorResponse(err, 'Grid purchase rate limit exceeded');
    throw err;
  }

  let body: { slug?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<PurchaseResponse>(
      { ok: false, error: 'INTERNAL', message: 'Malformed request.' },
    );
  }

  const slug = typeof body.slug === 'string' ? body.slug : '';
  const component = GRID_COMPONENTS_BY_SLUG[slug];
  if (!component) {
    return NextResponse.json<PurchaseResponse>({
      ok: false,
      error: 'UNKNOWN_COMPONENT',
      message: 'Unknown component.',
    });
  }

  const { data, error } = await supabase.rpc('grid_purchase', {
    p_slug: component.slug,
  });

  if (error) {
    console.error('[grid/purchase] rpc failed', error);
    return NextResponse.json<PurchaseResponse>({
      ok: false,
      error: 'INTERNAL',
      message: 'Something failed on our end. Try again.',
    });
  }

  const row = (Array.isArray(data) ? data[0] : data) as RpcRow | undefined;
  if (!row) {
    return NextResponse.json<PurchaseResponse>({
      ok: false,
      error: 'INTERNAL',
      message: 'Something failed on our end. Try again.',
    });
  }

  if (!row.ok) {
    return NextResponse.json<PurchaseResponse>({
      ok: false,
      error: toErrorCode(row.error_code),
      message: row.error_message ?? 'Purchase failed.',
    });
  }

  // Re-fetch the authoritative state (cheaper than the RPC returning everything shaped client-side)
  const fresh = await fetchGridState(supabase, user.id);
  return NextResponse.json<PurchaseResponse>({
    ok: true,
    newBalance: row.new_balance,
    state: fresh.state,
    quest: computeQuestView(fresh.state.itemsOwned),
    deployedSlug: component.slug as ComponentSlug,
  });
}
