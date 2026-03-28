// Legacy stub — system removed
// Stub — energy game system removed. Minimal exports kept for compatibility.

export const getChapterCompletionRewardUnits = (_totalMinutes: number): number => 0;
export const getPracticeRewardUnits = (_difficulty: any): number => 0;
export const getAvailableBudgetUnits = (..._args: any[]): number => 0;
export const formatKwh = (_value: number): string => '0 kWh';
export const formatUnitsAsKwh = (_units: number): string => '0 kWh';
export const unitsToKwh = (_units: number): number => 0;
export const getLevelProgress = (_xp: number) => ({ level: 1, progress: 0, nextLevelXp: 1000 });
export const INFRASTRUCTURE_NODES: any[] = [];
export const INFRASTRUCTURE_BY_ID: Record<string, any> = {};
export const DEFAULT_DEPLOYED_NODE_IDS: string[] = [];
export type InfrastructureNode = any;
export const TIER_COLORS: Record<string, string> = {};
export type CharacterTierId = string;
export type LevelDefinition = any;
