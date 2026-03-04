import { NextResponse } from 'next/server';
import {
  PRODUCT_EVENT_NAMES,
  type ProductEventName
} from '@/lib/analytics/productEvents';
import { createClient } from '@/lib/supabase/server';

const PRODUCT_EVENT_NAME_SET = new Set<string>(PRODUCT_EVENT_NAMES);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMissingAnalyticsTableError = (message: string) =>
  message.includes('product_funnel_events') &&
  (message.includes('does not exist') || message.includes('relation'));

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    const parsed = await request.json();
    if (!isRecord(parsed)) {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }
    payload = parsed;
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const eventName =
    typeof payload.eventName === 'string' ? payload.eventName.trim() : '';
  const sessionId =
    typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
  const path = typeof payload.path === 'string' ? payload.path.trim() : null;
  const metadata = isRecord(payload.metadata) ? payload.metadata : {};

  if (!PRODUCT_EVENT_NAME_SET.has(eventName)) {
    return NextResponse.json({ error: 'Unknown analytics event.' }, { status: 400 });
  }

  if (sessionId.length < 8) {
    return NextResponse.json({ error: 'sessionId is required.' }, { status: 400 });
  }

  const supabase = createClient();

  let userId: string | null = null;
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  const { error } = await supabase.from('product_funnel_events').insert({
    session_id: sessionId,
    user_id: userId,
    event_name: eventName as ProductEventName,
    path,
    metadata,
    occurred_at: new Date().toISOString()
  });

  if (error) {
    if (isMissingAnalyticsTableError(error.message.toLowerCase())) {
      return NextResponse.json({ accepted: true, stored: false }, { status: 202 });
    }

    console.warn('Analytics event insert failed:', error.message);
    return NextResponse.json({ accepted: true, stored: false }, { status: 202 });
  }

  return NextResponse.json({ accepted: true, stored: true }, { status: 201 });
}
