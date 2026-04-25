/* ── Server-side XP / streak validation for progress sync ─────────────────── */

export const MAX_XP_INCREASE_PER_SYNC = 500;
export const MAX_STREAK = 365;

/**
 * Computes safe XP and streak values that can be persisted.
 * - XP can only increase by at most `maxXpIncrease` per sync (prevents client manipulation).
 * - XP never decreases (server keeps the higher value).
 * - Streak is clamped to [0, maxStreak] and never decreases.
 */
export function computeSafeXpAndStreak(
  existingXp: number,
  existingStreak: number,
  clientXp: number,
  clientStreak: number,
  maxXpIncrease = MAX_XP_INCREASE_PER_SYNC,
  maxStreak = MAX_STREAK,
) {
  const safeXp = Math.max(existingXp, Math.min(clientXp, existingXp + maxXpIncrease));
  const safeStreak = Math.max(existingStreak, Math.min(Math.max(clientStreak, 0), maxStreak));
  return { safeXp, safeStreak };
}
