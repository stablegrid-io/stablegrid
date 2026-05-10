import { NextResponse } from 'next/server';

/**
 * Real-user-metrics sink.
 *
 * The client posts each web-vitals reading (CLS, LCP, INP, TTFB, FCP) and
 * each navigation-duration measurement here as JSON. We log them in dev so
 * we can eyeball performance during development; in production this endpoint
 * is the place to fan out to whatever sink we eventually use (Vercel
 * Analytics already gets web-vitals automatically when enabled, but landing
 * the readings here too gives us a route-grouped record we can query).
 *
 * Intentionally lightweight:
 *   - No DB write, no Supabase client
 *   - Accepts both `application/json` and `text/plain` (sendBeacon prefers
 *     text/plain), parses, and returns 204 immediately
 *   - Cookie-consent is enforced *client-side* by `WebVitalsReporter` —
 *     this route never sees a request from a non-consenting visitor
 */

interface VitalPayload {
  name: string;
  value: number;
  id?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
  pathname?: string;
}

export async function POST(request: Request) {
  let payload: VitalPayload | null = null;
  try {
    const body = await request.text();
    payload = JSON.parse(body) as VitalPayload;
  } catch {
    // Malformed payload — drop it on the floor; nothing to do.
    return new NextResponse(null, { status: 204 });
  }

  if (!payload || typeof payload.name !== 'string') {
    return new NextResponse(null, { status: 204 });
  }

  // Dev-only console output. Prod is a no-op so the route is cheap.
  if (process.env.NODE_ENV === 'development') {
    const value = typeof payload.value === 'number'
      ? payload.value.toFixed(payload.value < 10 ? 3 : 1)
      : payload.value;
    const rating = payload.rating ? ` [${payload.rating}]` : '';
    const path = payload.pathname ? ` ${payload.pathname}` : '';
    // eslint-disable-next-line no-console
    console.log(`[vitals]${path} ${payload.name}=${value}${rating}`);
  }

  return new NextResponse(null, { status: 204 });
}
