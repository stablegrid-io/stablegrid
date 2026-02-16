import type { MissionDifficulty } from '@/data/missions';

export const ENERGY_UNITS_PER_KWH = 1000;

export const ENERGY_REWARDS = {
  flashcardCorrectUnits: 20, // 0.02 kWh
  flashcardStreakMilestoneUnits: 300 // 0.3 kWh
} as const;

export const FLASHCARD_STREAK_MILESTONES = [5, 10, 20, 30, 50] as const;

const MISSION_REWARD_KWH_BY_DIFFICULTY: Record<MissionDifficulty, number> = {
  Medium: 0.5,
  Hard: 1.5,
  Expert: 3
};

export interface EnergyTier {
  id: number;
  title: string;
  minKwh: number;
  maxKwh: number | null;
  scene: string;
  insight: string;
}

export const ENERGY_TIERS: EnergyTier[] = [
  {
    id: 1,
    title: 'Coffee Corner',
    minKwh: 0,
    maxKwh: 2,
    scene: 'Kettle and small counter',
    insight: 'At 2 kWh you can power a 2.0 kW kettle for about 1 hour.'
  },
  {
    id: 2,
    title: 'Workspace',
    minKwh: 2,
    maxKwh: 10,
    scene: 'Laptop, monitor, and router',
    insight: 'At 10 kWh you can run a 60W laptop for ~166 hours.'
  },
  {
    id: 3,
    title: 'Office Bay',
    minKwh: 10,
    maxKwh: 50,
    scene: 'Workstation and office lighting',
    insight: 'At 50 kWh you can keep 10 LED bulbs on for ~500 hours.'
  },
  {
    id: 4,
    title: 'Server Rack',
    minKwh: 50,
    maxKwh: 150,
    scene: 'Active data-center rack',
    insight: 'At 150 kWh you can run a 2.0 kW rack for ~75 hours.'
  },
  {
    id: 5,
    title: 'Apartment',
    minKwh: 150,
    maxKwh: 400,
    scene: 'Apartment lights and appliances',
    insight: 'At 400 kWh you can power a 1.0 kW apartment load for ~400 hours.'
  },
  {
    id: 6,
    title: 'Mini-Grid',
    minKwh: 400,
    maxKwh: null,
    scene: 'Street block and neighborhood grid',
    insight: 'Beyond 400 kWh you are operating at neighborhood scale.'
  }
];

export interface PowerDevice {
  id: string;
  label: string;
  powerKw: number;
}

export const POWER_DEVICES: PowerDevice[] = [
  { id: 'kettle', label: 'Kettle', powerKw: 2.0 },
  { id: 'laptop', label: 'Laptop', powerKw: 0.06 },
  { id: 'led-bulb', label: 'LED Bulb', powerKw: 0.01 },
  { id: 'router', label: 'Router', powerKw: 0.01 },
  { id: 'fridge', label: 'Fridge', powerKw: 0.05 },
  { id: 'apartment', label: 'Apartment (typical)', powerKw: 1.0 }
];

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

export const getMissionRewardKwh = (difficulty: MissionDifficulty) =>
  MISSION_REWARD_KWH_BY_DIFFICULTY[difficulty];

export const getMissionRewardUnits = (difficulty: MissionDifficulty) =>
  kwhToUnits(getMissionRewardKwh(difficulty));

export const getChapterCompletionRewardUnits = (chapterMinutes: number) => {
  if (chapterMinutes >= 35) return kwhToUnits(8);
  if (chapterMinutes >= 20) return kwhToUnits(4);
  return kwhToUnits(2);
};

export const getEnergyTier = (kwh: number) => {
  return (
    [...ENERGY_TIERS]
      .reverse()
      .find((tier) => kwh >= tier.minKwh) ?? ENERGY_TIERS[0]
  );
};

export const getNextEnergyTier = (kwh: number) => {
  return ENERGY_TIERS.find((tier) => tier.minKwh > kwh) ?? null;
};

export const getTierProgressPct = (kwh: number) => {
  const current = getEnergyTier(kwh);
  const next = getNextEnergyTier(kwh);
  if (!next || current.maxKwh == null) return 100;
  const span = next.minKwh - current.minKwh;
  if (span <= 0) return 100;
  return Math.max(0, Math.min(100, ((kwh - current.minKwh) / span) * 100));
};

export const getHoursPowered = (kwh: number, powerKw: number) => {
  if (powerKw <= 0) return 0;
  return kwh / powerKw;
};
