import { NextResponse } from 'next/server';
import {
  normalizeConsentState,
  parseConsentRecord
} from '@/lib/cookies/cookie-consent';
import { createClient } from '@/lib/supabase/server';

interface CookieConsentRow {
  version: number;
  source: string;
  consent: unknown;
  consented_at: string;
}

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMissingCookieConsentTableError = (message: string) => {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('cookie_consents') &&
    (normalizedMessage.includes('does not exist') || normalizedMessage.includes('relation'))
  );
};

const parseCookieConsentRow = (row: CookieConsentRow) =>
  parseConsentRecord({
    version: row.version,
    timestamp: row.consented_at,
    source: row.source,
    consent: row.consent
  });

const parseConsentRecordPayload = (payload: unknown) => {
  if (isRecord(payload) && Object.prototype.hasOwnProperty.call(payload, 'record')) {
    return parseConsentRecord(payload.record);
  }

  return parseConsentRecord(payload);
};

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('cookie_consents')
    .select('version,source,consent,consented_at')
    .eq('user_id', user.id)
    .maybeSingle<CookieConsentRow>();

  if (error) {
    if (isMissingCookieConsentTableError(error.message)) {
      return NextResponse.json({ data: null, stored: false }, { status: 200 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const record = data ? parseCookieConsentRow(data) : null;
  return NextResponse.json({ data: record, stored: Boolean(record) });
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const record = parseConsentRecordPayload(payload);
  if (!record) {
    return NextResponse.json({ error: 'Invalid consent record.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('cookie_consents')
    .upsert(
      {
        user_id: user.id,
        version: record.version,
        source: record.source,
        consented_at: record.timestamp,
        consent: normalizeConsentState(record.consent)
      },
      { onConflict: 'user_id' }
    )
    .select('version,source,consent,consented_at')
    .single<CookieConsentRow>();

  if (error) {
    if (isMissingCookieConsentTableError(error.message)) {
      return NextResponse.json({ data: record, stored: false }, { status: 202 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const storedRecord = parseCookieConsentRow(data) ?? record;
  return NextResponse.json({ data: storedRecord, stored: true }, { status: 200 });
}
