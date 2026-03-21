export interface GridAsset {
  id: string;
  name: string;
  icon: string;
  cost: number;
  output: number;
  stability: number;
  color: string;
  description: string;
}

export interface GridSlot {
  id: number;
  x: number;
  y: number;
  label: string;
  voltage: string;
  loadDemand: number;
}

export interface GridConnection {
  from: number;
  to: number;
}

export interface GridScore {
  totalOutput: number;
  totalLoad: number;
  coverage: number;
  totalStability: number;
  stabilityRating: 'FRAGILE' | 'MODERATE' | 'RESILIENT' | 'FORTIFIED';
  deployed: number;
  totalSlots: number;
  invested: number;
}

export const GRID_ASSETS: GridAsset[] = [
  {
    id: 'solar',
    name: 'Solar Array',
    icon: '☀',
    cost: 120,
    output: 3,
    stability: 1,
    color: '#f0c040',
    description: '3 MW · Variable output',
  },
  {
    id: 'wind',
    name: 'Wind Turbine',
    icon: '🌬',
    cost: 180,
    output: 5,
    stability: 2,
    color: '#60d0f0',
    description: '5 MW · Weather dependent',
  },
  {
    id: 'battery',
    name: 'Battery Storage',
    icon: '🔋',
    cost: 250,
    output: 4,
    stability: 5,
    color: '#40e080',
    description: '4 MW · +5 stability',
  },
  {
    id: 'gas',
    name: 'Gas Turbine',
    icon: '🔥',
    cost: 350,
    output: 8,
    stability: 3,
    color: '#f07030',
    description: '8 MW · Dispatchable',
  },
  {
    id: 'hvdc',
    name: 'HVDC Interconnector',
    icon: '⚡',
    cost: 500,
    output: 10,
    stability: 8,
    color: '#d040e0',
    description: '10 MW · +8 stability',
  },
  {
    id: 'flywheel',
    name: 'Grid Flywheel',
    icon: '⏳',
    cost: 150,
    output: 0,
    stability: 6,
    color: '#20c0d0',
    description: '0 MW · +6 stability only',
  },
];

export const GRID_SLOTS: GridSlot[] = [
  { id: 0, x: 180, y: 80,  label: 'North Hub',      voltage: '330 kV', loadDemand: 6 },
  { id: 1, x: 380, y: 60,  label: 'East Relay',     voltage: '330 kV', loadDemand: 4 },
  { id: 2, x: 100, y: 200, label: 'West Plant',     voltage: '110 kV', loadDemand: 3 },
  { id: 3, x: 300, y: 190, label: 'Central Sub',    voltage: '110 kV', loadDemand: 8 },
  { id: 4, x: 480, y: 180, label: 'East District',  voltage: '110 kV', loadDemand: 5 },
  { id: 5, x: 200, y: 310, label: 'South Grid',     voltage: '35 kV',  loadDemand: 4 },
  { id: 6, x: 400, y: 300, label: 'Industrial',     voltage: '35 kV',  loadDemand: 7 },
];

export const GRID_CONNECTIONS: GridConnection[] = [
  { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 0, to: 3 },
  { from: 1, to: 3 }, { from: 1, to: 4 }, { from: 2, to: 3 },
  { from: 2, to: 5 }, { from: 3, to: 4 }, { from: 3, to: 5 },
  { from: 3, to: 6 }, { from: 4, to: 6 }, { from: 5, to: 6 },
];

export const TOTAL_LOAD = GRID_SLOTS.reduce((sum, s) => sum + s.loadDemand, 0); // 37 MW

export function calculateGridScore(
  placements: Record<number, string>,
): GridScore {
  let totalOutput = 0;
  let totalStability = 0;
  let invested = 0;

  Object.values(placements).forEach((assetId) => {
    const asset = GRID_ASSETS.find((a) => a.id === assetId);
    if (!asset) return;
    totalOutput += asset.output;
    totalStability += asset.stability;
    invested += asset.cost;
  });

  const coverage = Math.min(100, Math.round((totalOutput / TOTAL_LOAD) * 100));

  let stabilityRating: GridScore['stabilityRating'];
  if (totalStability >= 20) stabilityRating = 'FORTIFIED';
  else if (totalStability >= 15) stabilityRating = 'RESILIENT';
  else if (totalStability >= 8) stabilityRating = 'MODERATE';
  else stabilityRating = 'FRAGILE';

  return {
    totalOutput,
    totalLoad: TOTAL_LOAD,
    coverage,
    totalStability,
    stabilityRating,
    deployed: Object.keys(placements).length,
    totalSlots: GRID_SLOTS.length,
    invested,
  };
}
