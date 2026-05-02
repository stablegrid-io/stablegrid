/* ── BESS capacity ──────────────────────────────────────────────────────────── */

// Rated capacity of the user's battery reserve. Balance (xp − grid spending) is
// hard-capped at this value: awards that would push balance past it are dropped
// server-side (see sync_user_progress RPC), and read paths clamp defensively.
export const BATTERY_CAPACITY_KWH = 5000;

export const capBalance = (n: number) => Math.max(0, Math.min(BATTERY_CAPACITY_KWH, n));

/* ── kWh Reward System ──────────────────────────────────────────────────────── */

const TIER_MULTIPLIER: Record<string, number> = {
  junior: 1.0,
  mid: 1.5,
  senior: 3.0,
};

const BASE_REWARDS = {
  lessonRead: 5,
  practiceTask: 10,
  moduleComplete: 25,
  trackComplete: 200,
};

export function getLessonRewardKWh(trackLevel: string): number {
  const mult = TIER_MULTIPLIER[trackLevel] ?? 1;
  return Math.round(BASE_REWARDS.lessonRead * mult);
}

export function getPracticeTaskReward(trackLevel: string): number {
  const mult = TIER_MULTIPLIER[trackLevel] ?? 1;
  return Math.round(BASE_REWARDS.practiceTask * mult);
}

export function getModuleCompleteBonus(trackLevel: string): number {
  const mult = TIER_MULTIPLIER[trackLevel] ?? 1;
  return Math.round(BASE_REWARDS.moduleComplete * mult);
}

export function getTrackCompleteBonus(trackLevel: string): number {
  const mult = TIER_MULTIPLIER[trackLevel] ?? 1;
  return Math.round(BASE_REWARDS.trackComplete * mult);
}

export function getTierMultiplier(trackLevel: string): number {
  return TIER_MULTIPLIER[trackLevel] ?? 1;
}

/* ── Practice module payout (single source of truth) ─────────────────────── */

/**
 * Practice module reward formula.
 *
 * Scales with user effort (sum of estimatedMinutes) and tier (junior/mid/
 * senior multiplier), folds the module-completion bonus in as a flat
 * +20% on top of the per-task sum, and applies a smooth above-threshold
 * scaling so a barely-passing attempt earns ~60% and a perfect score earns
 * 100%. Below the threshold pays nothing — competence first, then reward.
 *
 *   kwhAtMax = round(Σ max(5, estimatedMinutes) × tierMultiplier × 1.2)
 *   factor   = score < threshold ? 0
 *            : 0.6 + 0.4 × (min(100, score) - threshold) / (100 - threshold)
 *   payout   = round(kwhAtMax × factor)
 *
 * The function is pure and deterministic — both the client (for display)
 * and the server (for crediting) call it on the same practice-set JSON
 * with the same score, so display and ledger never diverge. Threshold is
 * configurable per practice via metadata.minScorePercentForKwh; defaults
 * to 80%.
 */
export const DEFAULT_PRACTICE_KWH_THRESHOLD = 80;

interface PracticeKwhInput {
  metadata?: { trackLevel?: string; minScorePercentForKwh?: number };
  tasks: Array<{ estimatedMinutes?: number }>;
}

export interface PracticePayoutResult {
  /** kWh the user would earn at a perfect (100%) score on this module. */
  kwhAtMax: number;
  /** kWh the user earns at the given score (0 below threshold). */
  kwh: number;
  /** Threshold in use for this module (per-module override or default). */
  threshold: number;
  /** Whether the score cleared the threshold. */
  eligible: boolean;
}

const MIN_TASK_MINUTES = 5;
const MODULE_BONUS_MULT = 1.2;
const THRESHOLD_FLOOR_FACTOR = 0.6;

export function computePracticePayout(
  practiceSet: PracticeKwhInput,
  scorePercent: number,
): PracticePayoutResult {
  const tier = practiceSet.metadata?.trackLevel ?? 'junior';
  const tierMult = TIER_MULTIPLIER[tier] ?? 1;
  const threshold =
    practiceSet.metadata?.minScorePercentForKwh ?? DEFAULT_PRACTICE_KWH_THRESHOLD;

  const minutesSum = practiceSet.tasks.reduce(
    (sum, t) => sum + Math.max(MIN_TASK_MINUTES, t.estimatedMinutes ?? MIN_TASK_MINUTES),
    0,
  );
  const kwhAtMax = Math.max(0, Math.round(minutesSum * tierMult * MODULE_BONUS_MULT));

  if (scorePercent < threshold) {
    return { kwhAtMax, kwh: 0, threshold, eligible: false };
  }

  const above = Math.min(100, Math.max(threshold, scorePercent)) - threshold;
  const range = 100 - threshold;
  const factor =
    range > 0
      ? THRESHOLD_FLOOR_FACTOR + (1 - THRESHOLD_FLOOR_FACTOR) * (above / range)
      : 1.0;
  const kwh = Math.max(0, Math.round(kwhAtMax * factor));
  return { kwhAtMax, kwh, threshold, eligible: true };
}

/**
 * Final score percent — rounded the same way the results screen displays
 * it, so the kWh threshold check and the "X%" the user sees are always
 * the same number. Code-only practices (no MCQ fields) fall back to a
 * task-level pass rate so they aren't capped at 0%.
 */
export interface PracticeTaskStateForScore {
  checked?: boolean;
  selfReview?: boolean;
  allCorrect?: boolean;
  answers?: Record<string, { result: boolean | null } | undefined>;
}
export interface PracticeTaskForScore {
  template?: { fields?: Array<{ id: string }> };
}

export function computePracticeScorePercent(
  tasks: ReadonlyArray<PracticeTaskForScore>,
  taskStates: ReadonlyArray<PracticeTaskStateForScore | undefined>,
): number {
  let correctF = 0;
  let totalF = 0;
  let countedCodeTasks = 0;
  let passedCodeTasks = 0;
  for (let i = 0; i < tasks.length; i++) {
    const fields = tasks[i].template?.fields ?? [];
    const ts = taskStates[i];
    if (fields.length === 0) {
      if (ts?.checked && !ts.selfReview) {
        countedCodeTasks++;
        if (ts.allCorrect) passedCodeTasks++;
      }
      continue;
    }
    for (const field of fields) {
      totalF++;
      if (ts?.answers?.[field.id]?.result === true) correctF++;
    }
  }
  const raw =
    totalF > 0
      ? (correctF / totalF) * 100
      : countedCodeTasks > 0
        ? (passedCodeTasks / countedCodeTasks) * 100
        : 0;
  return Math.round(raw);
}

/* ── User Tier (derived from full progression context) ──────────────────────── */

// The real tier logic lives in lib/tiers.ts — it has to consider kWh, track
// completions, category breadth, and full-topic mastery. The helpers below
// are re-exports plus thin back-compat shims for callers that only know about
// a kWh number (pre-multi-criterion world).

import {
  TIER_REQUIREMENTS,
  getUserTier as getUserTierFromCtx,
  getTierProfileImage as getTierProfileImageImpl,
  type TierContext,
  type UserTier as TierName
} from './tiers';

export type UserTier = TierName;

// Legacy kWh-only thresholds. The new tier system (lib/tiers.ts) drops
// kWh from its criteria entirely — balance is hard-capped at 5 000, so
// the old 10 000 / 30 000 thresholds were unreachable. These constants
// stay only because two pricing/legend pills still render them; treat
// them as cosmetic, not as an integrity bound. Real promotion lives in
// TIER_REQUIREMENTS (theory tracks + practice tasks).
export const USER_TIER_THRESHOLDS: Record<UserTier, number> = {
  junior: 0,
  mid: 1500,
  senior: 4000
};

/**
 * Back-compat overload: callers that only have a kWh number can still call
 * getUserTier(kwh). It resolves against a tracks-empty context, which makes
 * the kWh gate a necessary-but-not-sufficient check — i.e., these call sites
 * will always see 'junior' until they're upgraded to pass completedTracks.
 * Call sites with the full context should use getUserTier(context).
 */
export function getUserTier(input: number | TierContext): UserTier {
  const ctx: TierContext =
    typeof input === 'number'
      ? {
          kwh: input,
          completedTracks: [],
          practiceTasksSolved: 0,
          practiceModulesCompleteByTier: { junior: 0, mid: 0, senior: 0 },
        }
      : input;
  return getUserTierFromCtx(ctx);
}

export const getTierProfileImage = getTierProfileImageImpl;

export function getNextTierThreshold(tier: UserTier): number | null {
  if (tier === 'junior') return USER_TIER_THRESHOLDS.mid;
  if (tier === 'mid') return USER_TIER_THRESHOLDS.senior;
  return null;
}

/* ── Legacy stubs (backward compatibility) ─────────────────────────────────── */

export const getChapterCompletionRewardUnits = (_totalMinutes: number): number => 0;
export const getPracticeRewardUnits = (_difficulty: any): number => 0;
export const getAvailableBudgetUnits = (..._args: any[]): number => 0;
export const formatKwh = (value: number): string => `${value.toLocaleString()} kWh`;
export const formatUnitsAsKwh = (units: number): string => `${units.toLocaleString()} kWh`;
export const unitsToKwh = (units: number): number => units;
export const getLevelProgress = (_xp: number) => ({ level: 1, progress: 0, nextLevelXp: 1000 });
export const INFRASTRUCTURE_NODES: any[] = [];
export const INFRASTRUCTURE_BY_ID: Record<string, any> = {};
export const DEFAULT_DEPLOYED_NODE_IDS: string[] = [];
export type InfrastructureNode = any;
export const TIER_COLORS: Record<string, string> = {};
export type CharacterTierId = string;
export type LevelDefinition = any;
export const ENERGY_REWARDS: Record<string, number> = {};
export const FLASHCARD_STREAK_MILESTONES: number[] = [];
export const kwhToUnits = (kwh: number): number => kwh;
export const getGridStabilityPct = (..._args: any[]): number => 100;
