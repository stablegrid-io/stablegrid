import { INFRASTRUCTURE_NODES, kwhToUnits } from '@/lib/energy';
import type {
  GridOpsAssetCategory,
  GridOpsAssetDefinition,
  GridOpsCampaignScenario,
  GridOpsEventDefinition,
  GridOpsMilestone,
  GridOpsRegionDefinition,
  GridOpsScenarioId,
  GridOpsSynergyDefinition
} from '@/lib/grid-ops/types';

export const GRID_OPS_DEFAULT_SCENARIO: GridOpsScenarioId = 'lithuania_v1';

export const GRID_OPS_VALID_SCENARIO_IDS: ReadonlySet<GridOpsScenarioId> = new Set([
  'lithuania_v1',
  'iberia_v1',
  'nordic_v1',
  'germany_v1',
  'europe_v1'
]);

export const isValidScenarioId = (value: unknown): value is GridOpsScenarioId =>
  typeof value === 'string' && (GRID_OPS_VALID_SCENARIO_IDS as Set<string>).has(value);

export const GRID_OPS_CAMPAIGN: GridOpsCampaignScenario[] = [
  {
    id: 'lithuania_v1',
    order: 1,
    name: 'Lithuania',
    subtitle: 'Baltic Grid Crisis',
    description:
      'Stabilize the Lithuanian grid as it desynchronizes from the Soviet-era BRELL ring and prepares to join the Continental European Network.',
    flag: '🇱🇹',
    completionThreshold: 100,
    unlockAfter: null
  },
  {
    id: 'iberia_v1',
    order: 2,
    name: 'Iberia',
    subtitle: 'Heatwave Protocol',
    description:
      'Manage the Spanish–Portuguese grid through record heat, solar variability spikes, and ageing legacy substations.',
    flag: '🇪🇸',
    completionThreshold: 100,
    unlockAfter: 'lithuania_v1'
  },
  {
    id: 'nordic_v1',
    order: 3,
    name: 'Nordic',
    subtitle: 'Hydro Dispatch',
    description:
      'Balance the world\'s most renewable-heavy grid. Hydropower reservoir management meets offshore wind volatility.',
    flag: '🇳🇴',
    completionThreshold: 100,
    unlockAfter: 'iberia_v1'
  },
  {
    id: 'germany_v1',
    order: 4,
    name: 'Germany',
    subtitle: 'Energiewende Reckoning',
    description:
      'Navigate post-nuclear Germany — 100% renewable target, south-north transmission bottlenecks, and the world\'s most scrutinized grid.',
    flag: '🇩🇪',
    completionThreshold: 100,
    unlockAfter: 'nordic_v1'
  },
  {
    id: 'europe_v1',
    order: 5,
    name: 'European Interconnect',
    subtitle: 'Continental Stability',
    description:
      'Manage the entire Continental European Network. 520 GW across 35 countries — one cascade can darken a continent.',
    flag: '🇪🇺',
    completionThreshold: 100,
    unlockAfter: 'germany_v1'
  }
];

export const GRID_OPS_BASE_STABILITY = 38;
export const GRID_OPS_BASE_FORECAST_CONFIDENCE = 24;

const ASSET_CATEGORY_BY_ID: Record<string, GridOpsAssetCategory> = {
  'control-center': 'monitoring',
  'smart-transformer': 'control',
  'solar-forecasting-array': 'forecasting',
  'battery-storage': 'flexibility',
  'frequency-controller': 'control',
  'demand-response-system': 'flexibility',
  'grid-flywheel': 'control',
  'hvdc-interconnector': 'reinforcement',
  'ai-grid-optimizer': 'forecasting'
};

const ASSET_DESCRIPTION_BY_ID: Record<string, string> = {
  'control-center': 'Restores telemetry visibility and dispatch command continuity.',
  'smart-transformer': 'Stabilizes bidirectional prosumer injections at the edge.',
  'solar-forecasting-array': 'Improves day-ahead and intra-day irradiance dispatch estimates.',
  'battery-storage': 'Absorbs renewable oversupply and discharges during peak stress.',
  'frequency-controller': 'Damps oscillations and keeps 50 Hz closer to nominal.',
  'demand-response-system': 'Shifts discretionary demand away from evening peaks.',
  'grid-flywheel': 'Adds fast inertial response for transient disturbances.',
  'hvdc-interconnector': 'Expands transfer flexibility across regional corridors.',
  'ai-grid-optimizer': 'Coordinates predictive balancing across the entire stack.'
};

const RISK_MITIGATION_BY_ID: Record<string, number> = {
  'control-center': 4,
  'smart-transformer': 6,
  'solar-forecasting-array': 5,
  'battery-storage': 11,
  'frequency-controller': 14,
  'demand-response-system': 16,
  'grid-flywheel': 10,
  'hvdc-interconnector': 12,
  'ai-grid-optimizer': 20
};

const FORECAST_EFFECT_BY_ID: Record<string, number> = {
  'control-center': 10,
  'smart-transformer': 3,
  'solar-forecasting-array': 19,
  'battery-storage': 2,
  'frequency-controller': 4,
  'demand-response-system': 3,
  'grid-flywheel': 2,
  'hvdc-interconnector': 6,
  'ai-grid-optimizer': 22
};

const POSITION_OVERRIDES: Record<string, { x: number; y: number }> = {
  'control-center': { x: 132, y: 330 },
  'solar-forecasting-array': { x: 150, y: 78 },
  'smart-transformer': { x: 334, y: 194 },
  'frequency-controller': { x: 500, y: 86 },
  'ai-grid-optimizer': { x: 634, y: 192 },
  'hvdc-interconnector': { x: 776, y: 188 },
  'grid-flywheel': { x: 786, y: 332 },
  'battery-storage': { x: 892, y: 328 },
  'demand-response-system': { x: 922, y: 90 }
};

export const GRID_OPS_ASSETS: GridOpsAssetDefinition[] = INFRASTRUCTURE_NODES.map(
  (node, index) => {
    const previousNode = INFRASTRUCTURE_NODES[index - 1];
    const position = POSITION_OVERRIDES[node.id] ?? node.position;

    return {
      id: node.id,
      name: node.name,
      shortLabel: node.icon,
      category: ASSET_CATEGORY_BY_ID[node.id] ?? 'control',
      description: ASSET_DESCRIPTION_BY_ID[node.id] ?? node.function,
      unlocks: node.unlocks,
      costUnits: kwhToUnits(node.kwhRequired),
      effects: {
        stability: node.stabilityImpactPct,
        riskMitigation: RISK_MITIGATION_BY_ID[node.id] ?? Math.max(2, Math.round(node.stabilityImpactPct * 0.6)),
        forecast: FORECAST_EFFECT_BY_ID[node.id] ?? 0
      },
      unlockRequirements: previousNode ? [previousNode.id] : [],
      position: {
        x: position.x,
        y: position.y,
        regionId:
          position.x < 400
            ? 'western-corridor'
            : position.x < 700
              ? 'central-mesh'
              : 'eastern-demand'
      },
      connects: [...node.connects]
    };
  }
);

export const GRID_OPS_ASSET_BY_ID = GRID_OPS_ASSETS.reduce<Record<string, GridOpsAssetDefinition>>(
  (accumulator, asset) => {
    accumulator[asset.id] = asset;
    return accumulator;
  },
  {}
);

export const GRID_OPS_REGIONS: GridOpsRegionDefinition[] = [
  {
    id: 'western-corridor',
    name: 'Western Monitoring Corridor',
    activationThreshold: 25
  },
  {
    id: 'central-mesh',
    name: 'Central Coordination Mesh',
    activationThreshold: 50
  },
  {
    id: 'eastern-demand',
    name: 'Eastern Demand Stabilization',
    activationThreshold: 75
  },
  {
    id: 'interconnect-ring',
    name: 'Interconnect Ring',
    activationThreshold: 100
  },
  {
    id: 'optimization-layer',
    name: 'Optimization Layer',
    activationThreshold: 110
  }
];

export const GRID_OPS_EVENTS: GridOpsEventDefinition[] = [
  {
    id: 'cloud_cover_surge',
    label: 'Cloud Cover Surge',
    durationTurns: 2,
    modifiers: {
      stabilityPenalty: 7,
      riskModifier: 10,
      forecastPenalty: 13
    },
    favoredCategories: ['forecasting'],
    affectedRegionIds: ['western-corridor', 'central-mesh'],
    briefing: 'Solar volatility increased. Forecast mismatch risk is elevated.'
  },
  {
    id: 'evening_peak',
    label: 'Evening Peak',
    durationTurns: 2,
    modifiers: {
      stabilityPenalty: 9,
      riskModifier: 14,
      forecastPenalty: 3
    },
    favoredCategories: ['flexibility', 'control'],
    affectedRegionIds: ['eastern-demand', 'central-mesh'],
    briefing: 'Demand ramp incoming. Flexible load and storage are high-value now.'
  },
  {
    id: 'wind_ramp',
    label: 'Wind Ramp Event',
    durationTurns: 2,
    modifiers: {
      stabilityPenalty: 6,
      riskModifier: 9,
      forecastPenalty: 8
    },
    favoredCategories: ['control', 'forecasting'],
    affectedRegionIds: ['interconnect-ring', 'central-mesh'],
    briefing: 'Fast generation ramps detected. Frequency control margin is tighter.'
  }
];

export const GRID_OPS_MILESTONES: GridOpsMilestone[] = [
  {
    id: 'regional-monitoring-restored',
    threshold: 25,
    title: 'Regional Monitoring Restored',
    description: 'Telemetry and command are online in the first corridor.'
  },
  {
    id: 'grid-coordination-online',
    threshold: 50,
    title: 'Grid Coordination Online',
    description: 'Core balancing layer is now operational.'
  },
  {
    id: 'variability-controlled',
    threshold: 75,
    title: 'Variability Controlled',
    description: 'Renewable volatility no longer dominates dispatch quality.'
  },
  {
    id: 'grid-stabilized',
    threshold: 100,
    title: 'Grid Stabilized',
    description: 'All major regions have reached stable operation thresholds.'
  },
  {
    id: 'optimization-phase',
    threshold: 110,
    title: 'Optimization Phase',
    description: 'The grid is stable and entering performance optimization mode.'
  }
];

// Per-scenario label overrides for the 'grid-stabilized' milestone (threshold 100)
export const GRID_STABILIZED_MILESTONE_TITLE: Record<GridOpsScenarioId, string> = {
  lithuania_v1: 'Baltic Grid Synchronized',
  iberia_v1: 'Iberian Grid Stabilized',
  nordic_v1: 'Nordic Grid Optimized',
  germany_v1: 'Energiewende Complete',
  europe_v1: 'Continental Network Online'
};

export const GRID_OPS_SYNERGIES: GridOpsSynergyDefinition[] = [
  {
    id: 'solar-battery-synergy',
    assetIds: ['solar-forecasting-array', 'battery-storage'],
    label: 'Solar Forecast + Battery',
    bonus: {
      stability: 6,
      riskMitigation: 8,
      forecast: 5
    }
  },
  {
    id: 'control-transformer-synergy',
    assetIds: ['control-center', 'smart-transformer'],
    label: 'Control Center + Smart Transformer',
    bonus: {
      stability: 4,
      riskMitigation: 5,
      forecast: 2
    }
  },
  {
    id: 'demand-battery-synergy',
    assetIds: ['demand-response-system', 'battery-storage'],
    label: 'Demand Response + Battery',
    bonus: {
      stability: 5,
      riskMitigation: 10,
      forecast: 2
    }
  },
  {
    id: 'interconnector-ai-synergy',
    assetIds: ['hvdc-interconnector', 'ai-grid-optimizer'],
    label: 'HVDC + AI Optimizer',
    bonus: {
      stability: 12,
      riskMitigation: 10,
      forecast: 9
    }
  }
];

// ─── Scenario-specific configurations ────────────────────────────────────────

// Per-scenario node position maps (x-region brackets preserved: <400 west, 400–700 central, ≥700 east)
const IBERIA_POSITIONS: Record<string, { x: number; y: number }> = {
  'control-center':          { x: 132, y: 290 },
  'solar-forecasting-array': { x: 190, y: 120 },
  'smart-transformer':       { x: 290, y: 200 },
  'frequency-controller':    { x: 460, y: 260 },
  'ai-grid-optimizer':       { x: 620, y:  90 },
  'hvdc-interconnector':     { x: 760, y: 280 },
  'grid-flywheel':           { x: 840, y: 380 },
  'battery-storage':         { x: 870, y: 160 },
  'demand-response-system':  { x: 960, y: 300 }
};

const NORDIC_POSITIONS: Record<string, { x: number; y: number }> = {
  'control-center':          { x: 160, y: 320 },
  'solar-forecasting-array': { x: 120, y: 100 },
  'smart-transformer':       { x: 300, y: 240 },
  'frequency-controller':    { x: 480, y: 140 },
  'ai-grid-optimizer':       { x: 580, y: 300 },
  'hvdc-interconnector':     { x: 760, y: 120 },
  'grid-flywheel':           { x: 730, y: 320 },
  'battery-storage':         { x: 900, y: 200 },
  'demand-response-system':  { x: 920, y: 360 }
};

const GERMANY_POSITIONS: Record<string, { x: number; y: number }> = {
  'control-center':          { x: 110, y: 350 },
  'solar-forecasting-array': { x: 200, y:  60 },
  'smart-transformer':       { x: 350, y: 240 },
  'frequency-controller':    { x: 520, y: 180 },
  'ai-grid-optimizer':       { x: 600, y: 350 },
  'hvdc-interconnector':     { x: 720, y:  80 },
  'grid-flywheel':           { x: 800, y: 260 },
  'battery-storage':         { x: 920, y: 380 },
  'demand-response-system':  { x: 880, y: 120 }
};

const EUROPE_POSITIONS: Record<string, { x: number; y: number }> = {
  'control-center':          { x: 100, y: 300 },
  'solar-forecasting-array': { x: 180, y:  80 },
  'smart-transformer':       { x: 280, y: 200 },
  'frequency-controller':    { x: 440, y: 100 },
  'ai-grid-optimizer':       { x: 660, y: 200 },
  'hvdc-interconnector':     { x: 800, y: 100 },
  'grid-flywheel':           { x: 750, y: 340 },
  'battery-storage':         { x: 940, y: 300 },
  'demand-response-system':  { x: 900, y:  60 }
};

// Per-scenario asset description overrides
const IBERIA_DESCRIPTIONS: Partial<Record<string, string>> = {
  'control-center':          'Restores telemetry under severe heat load — critical for thermal dispatch visibility.',
  'solar-forecasting-array': 'Tracks irradiance patterns across the Iberian solar corridor.',
  'smart-transformer':       'Manages bidirectional flows in thermally stressed legacy substations.',
  'battery-storage':         'Absorbs midday solar peaks and releases during evening AC demand surge.',
  'demand-response-system':  'Curtails discretionary cooling demand during heat emergency peaks.'
};

const NORDIC_DESCRIPTIONS: Partial<Record<string, string>> = {
  'control-center':          'Coordinates hydro and wind dispatch across the interconnected Nordic grid.',
  'solar-forecasting-array': 'Tracks limited solar generation and offshore wind forecast deviations.',
  'grid-flywheel':           'Replaces inertial response lost when hydro units are offline for maintenance.',
  'hvdc-interconnector':     'Carries Nordic hydro surplus to Continental Europe and the UK.',
  'demand-response-system':  'Manages heating loads to balance hydro reservoir drawdown targets.'
};

const GERMANY_DESCRIPTIONS: Partial<Record<string, string>> = {
  'control-center':          'Maintains dispatch visibility in the post-nuclear frequency volatility environment.',
  'frequency-controller':    'Critical inertia replacement following nuclear baseload phase-out.',
  'grid-flywheel':           'Provides synthetic inertia — the primary gap left by decommissioned nuclear units.',
  'hvdc-interconnector':     'The north-south corridor carrying offshore wind to Bavarian industrial loads.',
  'battery-storage':         'Buffers wind curtailment in the north and discharges into southern grid deficits.'
};

const EUROPE_DESCRIPTIONS: Partial<Record<string, string>> = {
  'control-center':          'Continental area control error monitoring — loss here triggers cascade risk.',
  'hvdc-interconnector':     'Pan-European interconnect spanning 35 national control areas.',
  'ai-grid-optimizer':       'Runs predictive optimization across the full Continental European Network.',
  'frequency-controller':    'Maintains the 50 Hz synchronous area shared by 400 million people.',
  'battery-storage':         'Grid-scale storage providing rapid-response balancing across the CEN.'
};

// Build a full asset array for a scenario from position and description overrides
function buildScenarioAssets(
  positionMap: Record<string, { x: number; y: number }>,
  descriptionOverrides: Partial<Record<string, string>> = {}
): GridOpsAssetDefinition[] {
  return INFRASTRUCTURE_NODES.map((node, index) => {
    const previousNode = INFRASTRUCTURE_NODES[index - 1];
    const pos = positionMap[node.id] ?? POSITION_OVERRIDES[node.id] ?? node.position;
    return {
      id: node.id,
      name: node.name,
      shortLabel: node.icon,
      category: (ASSET_CATEGORY_BY_ID[node.id] ?? 'control') as GridOpsAssetCategory,
      description: descriptionOverrides[node.id] ?? ASSET_DESCRIPTION_BY_ID[node.id] ?? node.function,
      unlocks: node.unlocks,
      costUnits: kwhToUnits(node.kwhRequired),
      effects: {
        stability: node.stabilityImpactPct,
        riskMitigation:
          RISK_MITIGATION_BY_ID[node.id] ??
          Math.max(2, Math.round(node.stabilityImpactPct * 0.6)),
        forecast: FORECAST_EFFECT_BY_ID[node.id] ?? 0
      },
      unlockRequirements: previousNode ? [previousNode.id] : [],
      position: {
        x: pos.x,
        y: pos.y,
        regionId:
          pos.x < 400 ? 'western-corridor' : pos.x < 700 ? 'central-mesh' : 'eastern-demand'
      },
      connects: [...node.connects]
    };
  });
}

// Pre-built asset arrays per scenario (Lithuania reuses the global)
const SCENARIO_ASSETS: Record<GridOpsScenarioId, GridOpsAssetDefinition[]> = {
  lithuania_v1: GRID_OPS_ASSETS,
  iberia_v1:    buildScenarioAssets(IBERIA_POSITIONS, IBERIA_DESCRIPTIONS),
  nordic_v1:    buildScenarioAssets(NORDIC_POSITIONS, NORDIC_DESCRIPTIONS),
  germany_v1:   buildScenarioAssets(GERMANY_POSITIONS, GERMANY_DESCRIPTIONS),
  europe_v1:    buildScenarioAssets(EUROPE_POSITIONS, EUROPE_DESCRIPTIONS)
};

// Per-scenario region name overrides (IDs remain stable across scenarios)
const SCENARIO_REGION_NAMES: Record<GridOpsScenarioId, Partial<Record<string, string>>> = {
  lithuania_v1: {},
  iberia_v1: {
    'western-corridor':  'Western Iberian Corridor',
    'central-mesh':      'Central Peninsula Mesh',
    'eastern-demand':    'Eastern Levant Zone',
    'interconnect-ring': 'Trans-Pyrenean Ring'
  },
  nordic_v1: {
    'western-corridor':  'Northern Hydro Corridor',
    'central-mesh':      'Central Nordic Mesh',
    'eastern-demand':    'Southern Demand Zone',
    'interconnect-ring': 'Baltic–North Sea Ring'
  },
  germany_v1: {
    'western-corridor':  'Western Industrial Corridor',
    'central-mesh':      'Central Transmission Mesh',
    'eastern-demand':    'Northern Renewable Zone',
    'interconnect-ring': 'European Interconnect Ring'
  },
  europe_v1: {
    'western-corridor':  'Western Continental Corridor',
    'central-mesh':      'Central European Mesh',
    'eastern-demand':    'Eastern Grid Zone',
    'interconnect-ring': 'CEN Synchronous Ring'
  }
};

// Per-scenario event cycles
const IBERIA_EVENTS: GridOpsEventDefinition[] = [
  {
    id: 'heatwave_demand_surge',
    label: 'Heatwave Demand Surge',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 10, riskModifier: 16, forecastPenalty: 6 },
    favoredCategories: ['flexibility', 'forecasting'],
    affectedRegionIds: ['eastern-demand', 'central-mesh'],
    briefing: 'Heatwave AC demand is spiking across the peninsula. Flexible load is critical.'
  },
  {
    id: 'solar_overgeneration',
    label: 'Solar Overgeneration',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 7, riskModifier: 8, forecastPenalty: 14 },
    favoredCategories: ['forecasting', 'control'],
    affectedRegionIds: ['western-corridor', 'central-mesh'],
    briefing: 'Midday solar curtailment risk is rising. Forecast accuracy is essential.'
  },
  {
    id: 'substation_thermal_stress',
    label: 'Substation Thermal Stress',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 9, riskModifier: 13, forecastPenalty: 4 },
    favoredCategories: ['control', 'flexibility'],
    affectedRegionIds: ['eastern-demand', 'western-corridor'],
    briefing: 'Legacy substations are approaching thermal limits. Voltage regulation is critical.'
  }
];

const NORDIC_EVENTS: GridOpsEventDefinition[] = [
  {
    id: 'hydro_reservoir_shift',
    label: 'Hydro Reservoir Shift',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 6, riskModifier: 11, forecastPenalty: 10 },
    favoredCategories: ['forecasting', 'control'],
    affectedRegionIds: ['western-corridor', 'central-mesh'],
    briefing: 'Hydro reservoir inflow is shifting. Real-time dispatch adjustments are required.'
  },
  {
    id: 'offshore_wind_gust',
    label: 'Offshore Wind Gust',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 8, riskModifier: 12, forecastPenalty: 12 },
    favoredCategories: ['control', 'forecasting'],
    affectedRegionIds: ['central-mesh', 'eastern-demand'],
    briefing: 'Offshore wind is ramping beyond forecast. Inertial response is under pressure.'
  },
  {
    id: 'cold_snap_demand',
    label: 'Cold Snap Demand Spike',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 9, riskModifier: 14, forecastPenalty: 4 },
    favoredCategories: ['flexibility', 'control'],
    affectedRegionIds: ['eastern-demand', 'interconnect-ring'],
    briefing: 'A cold snap is driving peak heating demand. Flexible assets are critical.'
  }
];

const GERMANY_EVENTS: GridOpsEventDefinition[] = [
  {
    id: 'nuclear_gap_stress',
    label: 'Nuclear Gap Stress',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 12, riskModifier: 18, forecastPenalty: 5 },
    favoredCategories: ['control', 'flexibility'],
    affectedRegionIds: ['western-corridor', 'central-mesh'],
    briefing: 'Post-nuclear inertia gap is widening. Frequency stability is under maximum stress.'
  },
  {
    id: 'north_south_bottleneck',
    label: 'N–S Transmission Bottleneck',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 9, riskModifier: 14, forecastPenalty: 7 },
    favoredCategories: ['reinforcement', 'forecasting'],
    affectedRegionIds: ['central-mesh', 'eastern-demand'],
    briefing: 'North-south corridor is congested. Redispatch costs are escalating.'
  },
  {
    id: 'industrial_demand_ramp',
    label: 'Industrial Demand Ramp',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 8, riskModifier: 11, forecastPenalty: 6 },
    favoredCategories: ['flexibility', 'control'],
    affectedRegionIds: ['eastern-demand', 'central-mesh'],
    briefing: 'Heavy industrial demand is ramping. Load flexibility is essential.'
  }
];

const EUROPE_EVENTS: GridOpsEventDefinition[] = [
  {
    id: 'cross_border_imbalance',
    label: 'Cross-Border Imbalance',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 10, riskModifier: 16, forecastPenalty: 9 },
    favoredCategories: ['reinforcement', 'forecasting'],
    affectedRegionIds: ['interconnect-ring', 'central-mesh'],
    briefing: 'Area control error is propagating across borders. Interconnect coordination is critical.'
  },
  {
    id: 'cascade_risk_alert',
    label: 'Cascade Risk Alert',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 11, riskModifier: 20, forecastPenalty: 6 },
    favoredCategories: ['control', 'flexibility'],
    affectedRegionIds: ['central-mesh', 'eastern-demand'],
    briefing: 'Pre-cascade N-1 contingency detected. Maintain voltage and frequency margins.'
  },
  {
    id: 'continental_frequency_drift',
    label: 'Continental Frequency Drift',
    durationTurns: 2,
    modifiers: { stabilityPenalty: 8, riskModifier: 13, forecastPenalty: 7 },
    favoredCategories: ['control', 'forecasting'],
    affectedRegionIds: ['western-corridor', 'interconnect-ring'],
    briefing: 'Continental frequency is drifting toward trip threshold. Deploy frequency regulation.'
  }
];

const SCENARIO_EVENTS_MAP: Record<GridOpsScenarioId, GridOpsEventDefinition[]> = {
  lithuania_v1: GRID_OPS_EVENTS,
  iberia_v1:    IBERIA_EVENTS,
  nordic_v1:    NORDIC_EVENTS,
  germany_v1:   GERMANY_EVENTS,
  europe_v1:    EUROPE_EVENTS
};

// Per-scenario base simulation values
const SCENARIO_BASE_VALUES: Record<GridOpsScenarioId, { stability: number; forecast: number }> = {
  lithuania_v1: { stability: GRID_OPS_BASE_STABILITY,  forecast: GRID_OPS_BASE_FORECAST_CONFIDENCE },
  iberia_v1:    { stability: 32,                       forecast: 20 },
  nordic_v1:    { stability: 44,                       forecast: 18 },
  germany_v1:   { stability: 28,                       forecast: 22 },
  europe_v1:    { stability: 35,                       forecast: 20 }
};

// ─── Scenario config resolver ─────────────────────────────────────────────────

export interface GridOpsScenarioConfig {
  assets: GridOpsAssetDefinition[];
  assetById: Record<string, GridOpsAssetDefinition>;
  assetRegionMap: Record<string, string>;
  regions: GridOpsRegionDefinition[];
  events: GridOpsEventDefinition[];
  baseStability: number;
  baseForecast: number;
}

export const resolveScenarioConfig = (scenarioId: GridOpsScenarioId): GridOpsScenarioConfig => {
  const assets = SCENARIO_ASSETS[scenarioId] ?? GRID_OPS_ASSETS;

  const assetById = assets.reduce<Record<string, GridOpsAssetDefinition>>(
    (acc, a) => { acc[a.id] = a; return acc; },
    {}
  );

  const assetRegionMap = assets.reduce<Record<string, string>>(
    (acc, a) => { acc[a.id] = a.position.regionId; return acc; },
    {}
  );

  const regionNameOverrides = SCENARIO_REGION_NAMES[scenarioId] ?? {};
  const regions: GridOpsRegionDefinition[] = GRID_OPS_REGIONS.map((r) => ({
    ...r,
    name: regionNameOverrides[r.id] ?? r.name
  }));

  const events = SCENARIO_EVENTS_MAP[scenarioId] ?? GRID_OPS_EVENTS;

  const baseValues = SCENARIO_BASE_VALUES[scenarioId] ?? {
    stability: GRID_OPS_BASE_STABILITY,
    forecast:  GRID_OPS_BASE_FORECAST_CONFIDENCE
  };

  return {
    assets,
    assetById,
    assetRegionMap,
    regions,
    events,
    baseStability: baseValues.stability,
    baseForecast:  baseValues.forecast
  };
};
