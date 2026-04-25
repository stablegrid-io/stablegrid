import { NextResponse } from 'next/server';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { toApiErrorResponse } from '@/lib/api/http';
import { createClient } from '@/lib/supabase/server';

const RATING_EVENTS = [
  'module_complete_feedback_submitted',
  'track_complete_feedback_submitted'
] as const;

interface TopicScore {
  average: number;
  count: number;
}

const isMissingTableError = (message: string) =>
  message.includes('product_funnel_events') &&
  (message.includes('does not exist') || message.includes('relation'));

/**
 * Aggregates the 1–5 star feedback submitted when a user completes a module
 * or a whole track, grouped by topic. Returns `{ [topic]: { average, count } }`.
 *
 * Public — this is a lightweight social-proof signal on the Learn topic cards.
 * Rate-limited per IP to deter scraping.
 */
export async function GET(request: Request) {
  try {
    await enforceRateLimit({
      scope: 'feedback_topic_scores_ip',
      key: getClientIp(request),
      limit: 120,
      windowSeconds: 60
    });

    const supabase = createClient();
    const { data, error } = await supabase
      .from('product_funnel_events')
      .select('event_name,metadata')
      .in('event_name', RATING_EVENTS);

    if (error) {
      if (isMissingTableError(error.message)) {
        // Table not yet provisioned (e.g. local dev before migration) — return empty.
        return NextResponse.json({ data: {} });
      }
      throw new Error(error.message);
    }

    const totals: Record<string, { sum: number; count: number }> = {};
    for (const row of data ?? []) {
      const metadata = (row as { metadata?: unknown }).metadata;
      if (!metadata || typeof metadata !== 'object') continue;
      const topic = (metadata as Record<string, unknown>).topic;
      const value = Number((metadata as Record<string, unknown>).value);
      if (typeof topic !== 'string' || !topic) continue;
      if (!Number.isFinite(value) || value < 1 || value > 5) continue;
      const bucket = totals[topic] ?? { sum: 0, count: 0 };
      bucket.sum += value;
      bucket.count += 1;
      totals[topic] = bucket;
    }

    const scores: Record<string, TopicScore> = {};
    for (const [topic, { sum, count }] of Object.entries(totals)) {
      if (count === 0) continue;
      scores[topic] = {
        average: Math.round((sum / count) * 10) / 10,
        count
      };
    }

    return NextResponse.json({ data: scores });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load topic scores.');
  }
}
