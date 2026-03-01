import { INFRASTRUCTURE_NODES, kwhToUnits } from '@/lib/energy';
import type {
  GridOpsAssetCategory,
  GridOpsAssetDefinition,
  GridOpsEventDefinition,
  GridOpsMilestone,
  GridOpsRegionDefinition,
  GridOpsScenarioId,
  GridOpsSynergyDefinition
} from '@/lib/grid-ops/types';

export const GRID_OPS_DEFAULT_SCENARIO: GridOpsScenarioId = 'iberia_v1';

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
  'ai-grid-optimizer': 17
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
    id: 'iberian-grid-stabilized',
    threshold: 100,
    title: 'Iberian Grid Stabilized',
    description: 'All major regions have reached stable operation thresholds.'
  },
  {
    id: 'optimization-phase',
    threshold: 110,
    title: 'Optimization Phase',
    description: 'The grid is stable and entering performance optimization mode.'
  }
];

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
      stability: 8,
      riskMitigation: 7,
      forecast: 9
    }
  }
];
