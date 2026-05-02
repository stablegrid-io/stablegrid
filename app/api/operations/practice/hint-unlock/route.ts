import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

// Persistent hint-unlock log for practice tasks.
//
// POST records one unlock:
//   { topic, moduleId, taskId, hintTier, xpCost }
//   → { ok: true, alreadyUnlocked: boolean }
// The composite primary key (user_id, module_id, task_id, hint_tier)
// makes duplicate inserts a no-op — we surface that via the
// `alreadyUnlocked` flag so the client knows whether to play the
// unlock animation or just render-as-unlocked.
//
// GET returns every unlocked hint for a module:
//   ?moduleId=module-PS1
//   → { data: [{ taskId, hintTier, xpCost, unlockedAt }] }

const isSafeId = (value: unknown, max = 200): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  /^[A-Za-z0-9_\-:.]+$/.test(value);

const isHintTier = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 8 &&
  /^H[0-9]{1,2}$/.test(value);

interface HintUnlockRow {
  task_id: string;
  hint_tier: string;
  xp_cost: number;
  unlocked_at: string;
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
        scope: 'practice_hint_unlock_user',
        key: user.id,
        limit: 120,
        windowSeconds: 5 * 60,
      }),
      enforceRateLimit({
        scope: 'practice_hint_unlock_ip',
        key: clientIp,
        limit: 240,
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
    if (!isSafeId(payload.taskId)) {
      throw new ApiRouteError('Invalid taskId.', 400);
    }
    if (!isHintTier(payload.hintTier)) {
      throw new ApiRouteError('Invalid hintTier.', 400);
    }
    // Cost is server-bounded — clients that lie about cost get clamped
    // to a sane range. The "real" cost lives in the practice-set JSON;
    // a future hardening could load that server-side and reject
    // mismatches outright.
    const xpCost = Math.max(0, Math.min(100, Number(payload.xpCost ?? 0) | 0));

    // Probe first so we can tell the caller whether this was a fresh
    // unlock or a duplicate. The composite PK makes the actual insert
    // idempotent regardless.
    const { data: existing, error: probeError } = await supabase
      .from('practice_hint_unlocks')
      .select('hint_tier')
      .eq('user_id', user.id)
      .eq('module_id', payload.moduleId)
      .eq('task_id', payload.taskId)
      .eq('hint_tier', payload.hintTier)
      .maybeSingle();
    if (probeError) {
      // Tolerate the missing-table case so environments that haven't
      // applied this migration still respond — the client just gets
      // its session-only behavior back.
      if (
        probeError.message.includes('practice_hint_unlocks') &&
        (probeError.message.includes('does not exist') || probeError.code === '42P01')
      ) {
        return NextResponse.json({ ok: true, alreadyUnlocked: false, warning: 'table missing' });
      }
      throw new Error(probeError.message);
    }
    if (existing) {
      return NextResponse.json({ ok: true, alreadyUnlocked: true });
    }

    const { error } = await supabase.from('practice_hint_unlocks').insert({
      user_id: user.id,
      module_id: payload.moduleId,
      task_id: payload.taskId,
      hint_tier: payload.hintTier,
      xp_cost: xpCost,
    });
    if (error) {
      // Race-window: another request inserted the same PK between the
      // probe and our insert. Treat it as already-unlocked.
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, alreadyUnlocked: true });
      }
      if (
        error.message.includes('practice_hint_unlocks') &&
        (error.message.includes('does not exist') || error.code === '42P01')
      ) {
        return NextResponse.json({ ok: true, alreadyUnlocked: false, warning: 'table missing' });
      }
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true, alreadyUnlocked: false });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record hint unlock.');
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
      .from('practice_hint_unlocks')
      .select('task_id, hint_tier, xp_cost, unlocked_at')
      .eq('user_id', user.id)
      .eq('module_id', moduleId);

    if (error) {
      // Same missing-table tolerance as task-attempt — return empty so
      // the UI degrades to session-only state instead of breaking.
      if (
        error.message.includes('practice_hint_unlocks') &&
        (error.message.includes('does not exist') || error.code === '42P01')
      ) {
        return NextResponse.json({ data: [] });
      }
      throw new Error(error.message);
    }

    const rows = (data ?? []) as HintUnlockRow[];
    return NextResponse.json({
      data: rows.map((r) => ({
        taskId: r.task_id,
        hintTier: r.hint_tier,
        xpCost: r.xp_cost,
        unlockedAt: r.unlocked_at,
      })),
    });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to load hint unlocks.');
  }
}
