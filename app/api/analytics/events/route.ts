import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest
} from '@/lib/api/protection';
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

interface AnalyticsPayload {
  eventName: ProductEventName;
  metadata: Record<string, unknown>;
  path: string | null;
  sessionId: string;
}

const parseAnalyticsPayload = async (request: Request) => {
  const payload = await parseJsonObject(request);
  const eventName =
    typeof payload.eventName === 'string' ? payload.eventName.trim() : '';
  const sessionId =
    typeof payload.sessionId === 'string' ? payload.sessionId.trim() : '';
  const path = typeof payload.path === 'string' ? payload.path.trim() : null;
  const rawMetadata = isRecord(payload.metadata) ? payload.metadata : {};
  // Sanitize: shallow object, max 20 keys, string values capped at 500 chars
  const metadata: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawMetadata).slice(0, 20)) {
    if (typeof v === 'string') metadata[k] = v.slice(0, 500);
    else if (typeof v === 'number' || typeof v === 'boolean') metadata[k] = v;
  }

  if (!PRODUCT_EVENT_NAME_SET.has(eventName)) {
    throw new ApiRouteError('Unknown analytics event.', 400);
  }

  if (sessionId.length < 8) {
    throw new ApiRouteError('sessionId is required.', 400);
  }

  return {
    eventName: eventName as ProductEventName,
    metadata,
    path,
    sessionId
  } satisfies AnalyticsPayload;
};

export async function POST(request: Request) {
  try {
    const payload = await parseAnalyticsPayload(request);
    const clientIp = getClientIp(request);
    const idempotencyKey = readIdempotencyKey(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'analytics_events_session',
        key: payload.sessionId,
        limit: 180,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'analytics_events_ip',
        key: clientIp,
        limit: 400,
        windowSeconds: 5 * 60
      })
    ]);

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

    const response = await runIdempotentJsonRequest({
      scope: 'analytics_events',
      ownerKey: userId ?? payload.sessionId,
      idempotencyKey,
      requestBody: {
        eventName: payload.eventName,
        metadata: payload.metadata,
        path: payload.path,
        sessionId: payload.sessionId
      },
      execute: async () => {
        const { error } = await supabase.from('product_funnel_events').insert({
          session_id: payload.sessionId,
          user_id: userId,
          event_name: payload.eventName,
          path: payload.path,
          metadata: payload.metadata,
          occurred_at: new Date().toISOString()
        });

        if (error) {
          if (isMissingAnalyticsTableError(error.message.toLowerCase())) {
            return {
              body: { accepted: true, stored: false },
              status: 202
            };
          }

          console.warn('Analytics event insert failed:', error.message);
          return {
            body: { accepted: true, stored: false },
            status: 202
          };
        }

        return {
          body: { accepted: true, stored: true },
          status: 201
        };
      }
    });

    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record analytics event.');
  }
}
