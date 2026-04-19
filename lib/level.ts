/* ── Level & dashboard metric calculations ────────────────────────────────── */

export const LEVEL_THRESHOLDS = [
  0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000, 12000, 18000, 25000, 35000, 50000,
];

export function computeLevel(xp: number) {
  let lvl = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) lvl = i + 1;
    else break;
  }
  const lo = LEVEL_THRESHOLDS[lvl - 1] ?? 0;
  const hi = LEVEL_THRESHOLDS[lvl] ?? lo;
  const range = hi - lo;
  const pct = range > 0 ? Math.min(100, Math.round(((xp - lo) / range) * 100)) : 100;
  const remaining = range > 0 ? hi - xp : 0;
  return { level: lvl, pct, nextThreshold: hi, remaining };
}

export function computeLessonsLeft(
  topicProgress: ReadonlyArray<{ theorySectionsTotal: number; theorySectionsRead: number }>
) {
  return topicProgress.reduce(
    (sum, tp) => sum + Math.max(0, tp.theorySectionsTotal - tp.theorySectionsRead),
    0,
  );
}
