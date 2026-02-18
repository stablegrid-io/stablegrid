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
  { id: 'optimal', label: 'OPTIMAL', minPct: 90, maxPct: 100, color: '#4ade80' },
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
    position: { x: 80, y: 220 },
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
    position: { x: 210, y: 145 },
    connects: ['solar-forecasting-array']
  },
  {
    id: 'solar-forecasting-array',
    name: 'Solar Forecasting Array',
    icon: 'S',
    kwhRequired: 3,
    stabilityImpactPct: 10,
    function: 'Predicts solar output 6h ahead',
    unlocks: 'Mission 001: Solar Surge',
    position: { x: 340, y: 90 },
    connects: ['battery-storage', 'hvdc-interconnector']
  },
  {
    id: 'battery-storage',
    name: 'Battery Storage (50 MWh)',
    icon: 'B',
    kwhRequired: 5,
    stabilityImpactPct: 15,
    function: 'Absorbs surges and discharges on peaks',
    unlocks: 'Mission 002: Evening Peak',
    position: { x: 480, y: 170 },
    connects: ['frequency-controller', 'grid-flywheel']
  },
  {
    id: 'frequency-controller',
    name: 'Frequency Controller',
    icon: 'F',
    kwhRequired: 7,
    stabilityImpactPct: 12,
    function: 'Maintains 50 Hz +/-0.5',
    unlocks: 'Mission 004: Frequency Drop',
    position: { x: 620, y: 250 },
    connects: ['demand-response-system', 'ai-grid-optimizer']
  },
  {
    id: 'demand-response-system',
    name: 'Demand Response System',
    icon: 'D',
    kwhRequired: 10,
    stabilityImpactPct: 18,
    function: 'Shifts EV charging to off-peak windows',
    unlocks: 'Advanced load balancing missions',
    position: { x: 760, y: 320 },
    connects: ['ai-grid-optimizer']
  },
  {
    id: 'grid-flywheel',
    name: 'Grid Flywheel',
    icon: 'G',
    kwhRequired: 12,
    stabilityImpactPct: 14,
    function: 'Instant mechanical frequency response',
    unlocks: 'Fast transient damping scenarios',
    position: { x: 620, y: 330 },
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
    position: { x: 760, y: 110 },
    connects: ['ai-grid-optimizer']
  },
  {
    id: 'ai-grid-optimizer',
    name: 'AI Grid Optimizer',
    icon: 'A',
    kwhRequired: 18,
    stabilityImpactPct: 25,
    function: 'Autonomous predictive balancing',
    unlocks: 'Mission 005: The Ghost Regulator',
    position: { x: 910, y: 210 },
    connects: []
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
