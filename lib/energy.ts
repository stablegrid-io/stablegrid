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
  moduleComplete: 25,
  trackComplete: 200,
};

export function getLessonRewardKWh(trackLevel: string): number {
  const mult = TIER_MULTIPLIER[trackLevel] ?? 1;
  return Math.round(BASE_REWARDS.lessonRead * mult);
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

/* ── User Tier (derived from accumulated kWh) ───────────────────────────────── */

export type UserTier = 'junior' | 'mid' | 'senior';

export const USER_TIER_THRESHOLDS: Record<UserTier, number> = {
  junior: 0,
  mid: 500,
  senior: 2500,
};

export function getUserTier(kwh: number): UserTier {
  if (kwh >= USER_TIER_THRESHOLDS.senior) return 'senior';
  if (kwh >= USER_TIER_THRESHOLDS.mid) return 'mid';
  return 'junior';
}

export function getTierProfileImage(tier: UserTier): string {
  return `/brand/profile-${tier}.png`;
}

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
