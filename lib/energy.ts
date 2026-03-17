import type { MissionDifficulty } from '@/data/missions';
import type { QuestionDifficulty } from '@/lib/types';

export const ENERGY_UNITS_PER_KWH = 1000;

export const BASE_GRID_VARIABILITY_PCT = 40;

export const ENERGY_REWARDS = {
  flashcardCorrectUnits: 20, // 0.02 kWh
  flashcardStreakMilestoneUnits: 300 // 0.30 kWh
} as const;

export const FLASHCARD_STREAK_MILESTONES = [5, 10, 20, 30, 50] as const;

const MISSION_REWARD_KWH_BY_DIFFICULTY: Record<MissionDifficulty, number> = {
  Medium: 0.4,
  Hard: 1.4,
  Expert: 2.4
};

const PRACTICE_REWARD_KWH_BY_DIFFICULTY: Record<QuestionDifficulty, number> = {
  easy: 0.04,
  medium: 0.08,
  hard: 0.12
};

const CHAPTER_COMPLETION_REWARD_KWH = 0.15;

export type StabilityTierId =
  | 'critical'
  | 'unstable'
  | 'marginal'
  | 'stable'
  | 'optimal';

export interface StabilityTier {
  id: StabilityTierId;
  label: string;
  minPct: number;
  maxPct: number;
  color: string;
}

export const STABILITY_TIERS: StabilityTier[] = [
  { id: 'optimal', label: 'OPTIMAL', minPct: 90, maxPct: 100, color: '#22b999' },
  { id: 'stable', label: 'STABLE', minPct: 75, maxPct: 90, color: '#22c55e' },
  { id: 'marginal', label: 'MARGINAL', minPct: 50, maxPct: 75, color: '#facc15' },
  { id: 'unstable', label: 'UNSTABLE', minPct: 25, maxPct: 50, color: '#fb923c' },
  { id: 'critical', label: 'CRITICAL', minPct: 0, maxPct: 25, color: '#f87171' }
];

export interface InfrastructureNode {
  id: string;
  name: string;
  icon: string;
  kwhRequired: number;
  stabilityImpactPct: number;
  function: string;
  unlocks: string;
  position: { x: number; y: number };
  connects: string[];
}

export const CONTROL_CENTER_ID = 'control-center';

export const INFRASTRUCTURE_NODES: InfrastructureNode[] = [
  {
    id: CONTROL_CENTER_ID,
    name: 'Control Center',
    icon: 'C',
    kwhRequired: 0,
    stabilityImpactPct: 5,
    function: 'Base monitoring operations',
    unlocks: 'Infrastructure telemetry',
    position: { x: 180, y: 210 },
    connects: ['smart-transformer']
  },
  {
    id: 'smart-transformer',
    name: 'Smart Transformer',
    icon: 'T',
    kwhRequired: 2,
    stabilityImpactPct: 8,
    function: 'Regulates prosumer injection',
    unlocks: 'Mission 003: Prosumer Swarm',
    position: { x: 320, y: 100 },
    connects: ['frequency-controller']
  },
  {
    id: 'solar-forecasting-array',
    name: 'Solar Forecasting Array',
    icon: 'S',
    kwhRequired: 3,
    stabilityImpactPct: 10,
    function: 'Predicts solar output 6h ahead',
    unlocks: 'Mission 001: Solar Surge',
    position: { x: 460, y: 55 },
    connects: ['smart-transformer']
  },
  {
    id: 'battery-storage',
    name: 'Battery Storage (50 MWh)',
    icon: 'B',
    kwhRequired: 5,
    stabilityImpactPct: 15,
    function: 'Absorbs surges and discharges on peaks',
    unlocks: 'Mission 002: Evening Peak',
    position: { x: 580, y: 165 },
    connects: ['demand-response-system']
  },
  {
    id: 'frequency-controller',
    name: 'Frequency Controller',
    icon: 'F',
    kwhRequired: 7,
    stabilityImpactPct: 12,
    function: 'Maintains 50 Hz +/-0.5',
    unlocks: 'Mission 004: Frequency Drop',
    position: { x: 720, y: 120 },
    connects: ['ai-grid-optimizer']
  },
  {
    id: 'demand-response-system',
    name: 'Demand Response System',
    icon: 'D',
    kwhRequired: 10,
    stabilityImpactPct: 18,
    function: 'Shifts EV charging to off-peak windows',
    unlocks: 'Advanced load balancing missions',
    position: { x: 860, y: 220 },
    connects: []
  },
  {
    id: 'grid-flywheel',
    name: 'Grid Flywheel',
    icon: 'G',
    kwhRequired: 12,
    stabilityImpactPct: 14,
    function: 'Instant mechanical frequency response',
    unlocks: 'Fast transient damping scenarios',
    position: { x: 620, y: 310 },
    connects: ['demand-response-system']
  },
  {
    id: 'hvdc-interconnector',
    name: 'HVDC Interconnector',
    icon: 'H',
    kwhRequired: 15,
    stabilityImpactPct: 20,
    function: 'Cross-border power import/export',
    unlocks: 'Cross-region balancing operations',
    position: { x: 580, y: 355 },
    connects: ['demand-response-system']
  },
  {
    id: 'ai-grid-optimizer',
    name: 'AI Grid Optimizer',
    icon: 'A',
    kwhRequired: 18,
    stabilityImpactPct: 14,
    function: 'Autonomous predictive balancing',
    unlocks: 'Mission 005: The Ghost Regulator',
    position: { x: 900, y: 180 },
    connects: ['hvdc-interconnector', 'battery-storage', 'grid-flywheel', 'demand-response-system']
  }
];

export const INFRASTRUCTURE_BY_ID: Record<string, InfrastructureNode> = INFRASTRUCTURE_NODES.reduce(
  (accumulator, node) => {
    accumulator[node.id] = node;
    return accumulator;
  },
  {} as Record<string, InfrastructureNode>
);

export const DEFAULT_DEPLOYED_NODE_IDS = [CONTROL_CENTER_ID];

export const unitsToKwh = (units: number) => units / ENERGY_UNITS_PER_KWH;
export const kwhToUnits = (kwh: number) => Math.round(kwh * ENERGY_UNITS_PER_KWH);

export const formatKwh = (
  kwh: number,
  maximumFractionDigits: number = 2
) => `${kwh.toLocaleString(undefined, { maximumFractionDigits })} kWh`;

export const formatUnitsAsKwh = (
  units: number,
  maximumFractionDigits: number = 2
) => formatKwh(unitsToKwh(units), maximumFractionDigits);

export const getPracticeRewardKwh = (difficulty: QuestionDifficulty) =>
  PRACTICE_REWARD_KWH_BY_DIFFICULTY[difficulty];

export const getPracticeRewardUnits = (difficulty: QuestionDifficulty) =>
  kwhToUnits(getPracticeRewardKwh(difficulty));

export const getMissionRewardKwh = (difficulty: MissionDifficulty) =>
  MISSION_REWARD_KWH_BY_DIFFICULTY[difficulty];

export const getMissionRewardUnits = (difficulty: MissionDifficulty) =>
  kwhToUnits(getMissionRewardKwh(difficulty));

export const getChapterCompletionRewardUnits = (_chapterMinutes: number) => {
  return kwhToUnits(CHAPTER_COMPLETION_REWARD_KWH);
};

export const getSpentInfrastructureUnits = (deployedNodeIds: string[]) => {
  return deployedNodeIds.reduce((total, nodeId) => {
    const node = INFRASTRUCTURE_BY_ID[nodeId];
    if (!node) return total;
    return total + kwhToUnits(node.kwhRequired);
  }, 0);
};

export const getAvailableBudgetUnits = (
  totalEarnedUnits: number,
  deployedNodeIds: string[]
) => {
  return Math.max(0, totalEarnedUnits - getSpentInfrastructureUnits(deployedNodeIds));
};

export const getGridStabilityPct = (
  deployedNodeIds: string[],
  baseVariabilityPct: number = BASE_GRID_VARIABILITY_PCT
) => {
  const stabilityFromInfrastructure = deployedNodeIds.reduce((total, nodeId) => {
    const node = INFRASTRUCTURE_BY_ID[nodeId];
    return total + (node?.stabilityImpactPct ?? 0);
  }, 0);

  const rawStability = 100 - baseVariabilityPct + stabilityFromInfrastructure;
  return Math.max(0, Math.min(100, rawStability));
};

export const getStabilityTier = (stabilityPct: number) => {
  return (
    STABILITY_TIERS.find(
      (tier) => stabilityPct >= tier.minPct && stabilityPct <= tier.maxPct
    ) ?? STABILITY_TIERS[STABILITY_TIERS.length - 1]
  );
};

export const getDeployableInfrastructureIds = (
  deployedNodeIds: string[],
  availableBudgetKwh: number
) => {
  return INFRASTRUCTURE_NODES.filter((node) => {
    if (deployedNodeIds.includes(node.id)) {
      return false;
    }
    return availableBudgetKwh >= node.kwhRequired;
  }).map((node) => node.id);
};

export const getNextInfrastructureNode = (deployedNodeIds: string[]) => {
  return (
    INFRASTRUCTURE_NODES.find((node) => !deployedNodeIds.includes(node.id)) ?? null
  );
};

// ── Level System ─────────────────────────────────────────────────────────────

export type CharacterTierId = 'cadet' | 'engineer' | 'architect' | 'commander';

export interface LevelDefinition {
  level: number; // 1–50
  title: string;
  tier: CharacterTierId;
  cumulativeUnitsRequired: number;
}

// Quadratic XP curve: LEVEL_BASE * (level-1)^LEVEL_EXPONENT
// Level 5 ≈ 5k cumulative, Level 20 ≈ 68k, Level 50 ≈ 720k
const LEVEL_BASE_UNITS = 400;
const LEVEL_EXPONENT = 1.85;

export const LEVEL_TABLE: LevelDefinition[] = (() => {
  let cumulative = 0;
  return Array.from({ length: 50 }, (_, i) => {
    const level = i + 1;
    const required =
      level === 1 ? 0 : Math.round(LEVEL_BASE_UNITS * Math.pow(level - 1, LEVEL_EXPONENT));
    cumulative += required;
    const title =
      level <= 5
        ? 'Grid Cadet'
        : level <= 10
          ? 'Grid Technician'
          : level <= 20
            ? 'Grid Engineer'
            : level <= 30
              ? 'Senior Engineer'
              : level <= 40
                ? 'Grid Architect'
                : level <= 49
                  ? 'Principal Engineer'
                  : 'Grid Commander';
    const tier: CharacterTierId =
      level <= 10 ? 'cadet' : level <= 30 ? 'engineer' : level <= 49 ? 'architect' : 'commander';
    return { level, title, tier, cumulativeUnitsRequired: cumulative };
  });
})();

export const TIER_COLORS: Record<CharacterTierId, { primary: string; glow: string }> = {
  cadet: { primary: '#5ba3f5', glow: 'rgba(91,163,245,0.35)' },
  engineer: { primary: '#22b999', glow: 'rgba(34,185,153,0.35)' },
  architect: { primary: '#f5b942', glow: 'rgba(245,185,66,0.35)' },
  commander: { primary: '#c0392b', glow: 'rgba(192,57,43,0.40)' }
};

export function getLevelFromUnits(totalUnits: number): LevelDefinition {
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (totalUnits >= LEVEL_TABLE[i].cumulativeUnitsRequired) return LEVEL_TABLE[i];
  }
  return LEVEL_TABLE[0];
}

export function getLevelProgress(totalUnits: number): {
  current: LevelDefinition;
  next: LevelDefinition | null;
  progressPct: number;
  unitsNeededForNext: number;
} {
  const current = getLevelFromUnits(totalUnits);
  // LEVEL_TABLE is 0-indexed; current.level is 1-indexed → LEVEL_TABLE[current.level] is the next entry
  const next = LEVEL_TABLE[current.level] ?? null;
  if (!next) return { current, next: null, progressPct: 100, unitsNeededForNext: 0 };
  const bandSize = next.cumulativeUnitsRequired - current.cumulativeUnitsRequired;
  const progress = totalUnits - current.cumulativeUnitsRequired;
  return {
    current,
    next,
    progressPct: Math.min(100, Math.round((progress / bandSize) * 100)),
    unitsNeededForNext: Math.max(0, bandSize - progress)
  };
}
