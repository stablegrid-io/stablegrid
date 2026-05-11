import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

// kWh event log — server-side persistence for the Generation chart.
// GET returns the operator's events (newest first, capped). POST accepts a
// batch from the client store and inserts new rows; the (user_id, client_id)
// unique constraint makes replays a no-op so the client can safely retry.

const ALLOWED_SOURCES = new Set([
  'flashcard-correct',
  'streak-milestone',
  'chapter-complete',
  'lesson-read',
  'practice-task',
  'practice-module-complete',
  'track-complete',
  'mission',
  'infrastructure-deploy',
  'manual',
]);

const MAX_EVENTS_PER_REQUEST = 100;
const MAX_EVENTS_PER_FETCH = 500;
const MAX_UNITS_PER_EVENT = 10000;

interface IncomingEvent {
  client_id: string;
  ts: string;
  source: string;
  units: number;
  label: string | null;
  topic: string | null;
}

const parseEvents = async (request: Request): Promise<IncomingEvent[]> => {
  const payload = await parseJsonObject(request);
  const raw = payload.events;
  if (!Array.isArray(raw)) {
    throw new ApiRouteError('events must be an array.', 400);
  }
  if (raw.length === 0) {
    return [];
  }
  if (raw.length > MAX_EVENTS_PER_REQUEST) {
    throw new ApiRouteError(
      `Too many events in one request (max ${MAX_EVENTS_PER_REQUEST}).`,
      400,
    );
  }

  return raw.map((entry, idx) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new ApiRouteError(`events[${idx}] must be an object.`, 400);
    }
    const e = entry as Record<string, unknown>;
    const clientId = typeof e.id === 'string' ? e.id : null;
    const source = typeof e.source === 'string' ? e.source : null;
    const units = Number(e.units);
    const tsRaw = e.timestamp;
    const label = typeof e.label === 'string' ? e.label : null;
    const topic = typeof e.topic === 'string' ? e.topic : null;

    if (!clientId || clientId.length > 64) {
      throw new ApiRouteError(`events[${idx}].id must be a string ≤64 chars.`, 400);
    }
    if (!source || !ALLOWED_SOURCES.has(source)) {
      throw new ApiRouteError(`events[${idx}].source is not a recognised source.`, 400);
    }
    if (!Number.isFinite(units) || units <= 0 || units > MAX_UNITS_PER_EVENT) {
      throw new ApiRouteError(
        `events[${idx}].units must be a finite number in (0, ${MAX_UNITS_PER_EVENT}].`,
        400,
      );
    }
    const tsMs = typeof tsRaw === 'number' ? tsRaw : Number(tsRaw);
    if (!Number.isFinite(tsMs) || tsMs <= 0) {
      throw new ApiRouteError(`events[${idx}].timestamp must be a unix-ms number.`, 400);
    }
    // Reject clock-skewed clients (events in the future) and bizarre
    // backfill attempts (events older than the product itself). Matches
    // the DB-level check from migration 20260511130000.
    const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    if (tsMs < nowMs - FIVE_YEARS_MS || tsMs > nowMs + ONE_DAY_MS) {
      throw new ApiRouteError(
        `events[${idx}].timestamp is outside the accepted window.`,
        400,
      );
    }

    return {
      client_id: clientId,
      ts: new Date(tsMs).toISOString(),
      source,
      units: Math.round(units * 100) / 100,
      label: label && label.length <= 200 ? label : null,
      topic: topic && topic.length <= 64 ? topic : null,
    };
  });
};

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await Promise.all([
      enforceRateLimit({
        scope: 'energy_events_get_user',
        key: user.id,
        limit: 120,
        windowSeconds: 5 * 60,
      }),
      enforceRateLimit({
        scope: 'energy_events_get_ip',
        key: getClientIp(request),
        limit: 240,
        windowSeconds: 5 * 60,
      }),
    ]);

    const { data, error } = await supabase
      .from('energy_events')
      .select('client_id, ts, source, units, label, topic')
      .eq('user_id', user.id)
      .order('ts', { ascending: false })
      .limit(MAX_EVENTS_PER_FETCH);

    if (error) {
      throw new Error(error.message);
    }

    // Return shape the client EnergyEvent type expects: id, source, units
    // (number), timestamp (unix ms), label, topic. The store dedupes by
    // id when merging, so we re-use client_id as the canonical id.
    const events = (data ?? []).map((row) => ({
      id: row.client_id as string,
      source: row.source as string,
      units: Number(row.units),
      timestamp: Date.parse(row.ts as string),
      label: row.label as string | null,
      topic: row.topic as string | null,
    }));

    return NextResponse.json({ data: { events } });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load energy events.');
  }
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const events = await parseEvents(request);
    const clientIp = getClientIp(request);

    await Promise.all([
      enforceRateLimit({
        scope: 'energy_events_post_user',
        key: user.id,
        limit: 60,
        windowSeconds: 5 * 60,
      }),
      enforceRateLimit({
        scope: 'energy_events_post_ip',
        key: clientIp,
        limit: 120,
        windowSeconds: 5 * 60,
      }),
    ]);

    if (events.length === 0) {
      return NextResponse.json({ data: { inserted: 0 } });
    }

    // Upsert on (user_id, client_id) so retries / multi-tab races are
    // idempotent — same event id from the same operator never double-
    // counts. We deliberately don't update existing rows (events are
    // append-only) by using ignoreDuplicates.
    const rows = events.map((e) => ({
      user_id: user.id,
      client_id: e.client_id,
      ts: e.ts,
      source: e.source,
      units: e.units,
      label: e.label,
      topic: e.topic,
    }));

    const { error, count } = await supabase
      .from('energy_events')
      .upsert(rows, {
        onConflict: 'user_id,client_id',
        ignoreDuplicates: true,
        count: 'exact',
      });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ data: { inserted: count ?? 0 } });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record energy events.');
  }
}
