import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';
import { getPracticeSet } from '@/data/operations/practice-sets';
import {
  BATTERY_CAPACITY_KWH,
  computePracticePayout,
} from '@/lib/energy';

// Once-per-(user, module) kWh payout for practice sets.
//
// POST records one payout:
//   { topic, moduleId, scorePercent }
//   → { ok: true, alreadyPaid: boolean, kwh: number, kwhAtMax: number,
//        threshold: number, eligible: boolean, paidAt: string }
// The reward amount is computed server-side from the bundled practice-set
// JSON via computePracticePayout, so the client cannot inflate it. The
// composite primary key (user_id, module_id) makes a second insert a no-op
// — we surface it via `alreadyPaid` so the UI shows "Already earned" and
// the kWh ledger never double-credits.
//
// GET returns the existing payout, if any:
//   ?moduleId=module-JA
//   → { alreadyPaid: boolean, kwh: number, paidAt: string | null }

const isSafeId = (value: unknown, max = 200): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  /^[A-Za-z0-9_\-:.]+$/.test(value);

const isModuleNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('practice_module_payouts') &&
    (msg.includes('does not exist') || msg.includes('42p01'))
  );
};

interface PayoutRow {
  kwh: number;
  paid_at: string;
  score_percent: number;
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
    const clientIp = getClientIp(request);
    await Promise.all([
      enforceRateLimit({
        scope: 'practice_payout_user',
        key: user.id,
        limit: 60,
        windowSeconds: 5 * 60,
      }),
      enforceRateLimit({
        scope: 'practice_payout_ip',
        key: clientIp,
        limit: 120,
        windowSeconds: 5 * 60,
      }),
    ]);

    const payload = await parseJsonObject(request);
    if (!isSafeId(payload.topic, 64)) {
      throw new ApiRouteError('Invalid topic.', 400);
    }
    if (!isSafeId(payload.moduleId)) {
      throw new ApiRouteError('Invalid moduleId.', 400);
    }
    const rawScore = Number(payload.scorePercent);
    if (!Number.isFinite(rawScore)) {
      throw new ApiRouteError('Invalid scorePercent.', 400);
    }
    const scorePercent = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Strip the canonical "module-" prefix and look the practice set up
    // in the bundled registry. This is the integrity boundary — the
    // reward amount is derived from the JSON server-side, so a tampered
    // client can't claim a bigger payout than the data says.
    const modulePrefix = payload.moduleId.replace(/^module-/, '');
    const practiceSet = getPracticeSet(payload.topic, modulePrefix);
    if (!practiceSet) {
      throw new ApiRouteError('Unknown (topic, moduleId) — refusing to credit.', 400);
    }

    const { kwh, kwhAtMax, threshold, eligible } = computePracticePayout(
      practiceSet,
      scorePercent,
    );

    // Below threshold: no payout, no row inserted. The client still got
    // a successful response so it can render the "score X% — need Y%"
    // copy without a second round-trip to discover ineligibility.
    if (!eligible || kwh <= 0) {
      return NextResponse.json({
        ok: true,
        alreadyPaid: false,
        kwh: 0,
        kwhAtMax,
        threshold,
        eligible,
        paidAt: null,
      });
    }

    // Idempotent insert — if a row already exists for this (user, module)
    // the unique-PK conflict is suppressed and we surface the existing
    // payout instead of crediting a second time.
    const { data: insertData, error: insertError } = await supabase
      .from('practice_module_payouts')
      .insert({
        user_id: user.id,
        topic: payload.topic,
        module_id: payload.moduleId,
        score_percent: scorePercent,
        kwh,
      })
      .select('kwh,paid_at,score_percent')
      .single();

    if (insertError) {
      // Tolerate the missing-table case so dev environments that haven't
      // applied the migration still respond — the client falls back to
      // its localStorage cache. Reported as paid=false so the user can
      // still earn kWh client-side via addXP; the integrity guarantee
      // returns once the migration ships.
      if (isModuleNotFoundError(new Error(insertError.message))) {
        return NextResponse.json({
          ok: true,
          alreadyPaid: false,
          kwh,
          kwhAtMax,
          threshold,
          eligible,
          paidAt: null,
          warning: 'practice_module_payouts table not yet migrated.',
        });
      }

      // Unique-violation → already paid. Re-read the existing row and
      // surface its values; the user gets no fresh kWh.
      const isUnique =
        insertError.code === '23505' ||
        insertError.message.toLowerCase().includes('duplicate');
      if (isUnique) {
        const { data: existing } = await supabase
          .from('practice_module_payouts')
          .select('kwh,paid_at,score_percent')
          .eq('user_id', user.id)
          .eq('module_id', payload.moduleId)
          .maybeSingle<PayoutRow>();
        return NextResponse.json({
          ok: true,
          alreadyPaid: true,
          kwh: existing?.kwh ?? 0,
          kwhAtMax,
          threshold,
          eligible,
          paidAt: existing?.paid_at ?? null,
        });
      }

      throw new Error(insertError.message);
    }

    // Fresh insert: credit the user_progress ledger. We do read-then-
    // write rather than an RPC because (a) practice payouts are once
    // per (user, module) so concurrent payouts on the same user are
    // already serialized by the unique PK above, and (b) the periodic
    // saveProgress() sync reconciles any tiny drift to the server's
    // value. Cap mirrors BATTERY_CAPACITY_KWH so users never exceed
    // their reserve.
    const { data: progressRow } = await supabase
      .from('user_progress')
      .select('xp')
      .eq('user_id', user.id)
      .maybeSingle<{ xp: number | null }>();
    const currentXp = Math.max(0, Number(progressRow?.xp ?? 0));
    const newXp = Math.min(BATTERY_CAPACITY_KWH, currentXp + kwh);

    if (progressRow == null) {
      // No user_progress row yet — insert one so the credit lands.
      await supabase.from('user_progress').insert({
        user_id: user.id,
        xp: newXp,
      });
    } else {
      await supabase
        .from('user_progress')
        .update({ xp: newXp, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      ok: true,
      alreadyPaid: false,
      kwh: insertData?.kwh ?? kwh,
      kwhAtMax,
      threshold,
      eligible,
      paidAt: insertData?.paid_at ?? new Date().toISOString(),
      xp: newXp,
    });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record payout.');
  }
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const moduleId = url.searchParams.get('moduleId');
  if (!isSafeId(moduleId)) {
    return NextResponse.json({ error: 'Invalid moduleId.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('practice_module_payouts')
      .select('kwh,paid_at,score_percent')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .maybeSingle<PayoutRow>();

    if (error) {
      if (isModuleNotFoundError(new Error(error.message))) {
        // Degrade gracefully when the migration hasn't been applied.
        return NextResponse.json({ alreadyPaid: false, kwh: 0, paidAt: null });
      }
      throw new Error(error.message);
    }

    if (!data) {
      return NextResponse.json({ alreadyPaid: false, kwh: 0, paidAt: null });
    }
    return NextResponse.json({
      alreadyPaid: true,
      kwh: data.kwh,
      paidAt: data.paid_at,
      scorePercent: Number(data.score_percent),
    });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load payout.');
  }
}
