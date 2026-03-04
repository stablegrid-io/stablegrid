export type GridOpsScenarioId = 'iberia_v1';

export type GridOpsAssetCategory =
  | 'monitoring'
  | 'flexibility'
  | 'control'
  | 'forecasting'
  | 'reinforcement';

export type GridOpsNodeState = 'offline' | 'connected' | 'stabilized' | 'optimized';

export type GridOpsAssetStatus = 'deployed' | 'available' | 'locked';

export type GridOpsVisualCategory =
  | 'monitoring'
  | 'control'
  | 'forecasting'
  | 'flexibility'
  | 'reinforcement';

export type GridOpsVisualIcon =
  | 'radar'
  | 'transformer'
  | 'sun'
  | 'battery'
  | 'frequency'
  | 'demand'
  | 'flywheel'
  | 'hvdc'
  | 'ai';

export type GridOpsNodeImportance = 'anchor' | 'primary' | 'secondary';

export type GridOpsMicroIndicator =
  | 'sync'
  | 'waveform'
  | 'forecast_pct'
  | 'battery_bar'
  | 'flow_route';

export interface GridOpsAssetEffect {
  stability: number;
  riskMitigation: number;
  forecast: number;
}

export interface GridOpsMapPosition {
  x: number;
  y: number;
  regionId: string;
}

export interface GridOpsAssetDefinition {
  id: string;
  name: string;
  shortLabel: string;
  category: GridOpsAssetCategory;
  description: string;
  unlocks: string;
  costUnits: number;
  effects: GridOpsAssetEffect;
  unlockRequirements: string[];
  position: GridOpsMapPosition;
  connects: string[];
}

export interface GridOpsEventDefinition {
  id: string;
  label: string;
  durationTurns: number;
  modifiers: {
    stabilityPenalty: number;
    riskModifier: number;
    forecastPenalty: number;
  };
  favoredCategories: GridOpsAssetCategory[];
  affectedRegionIds: string[];
  briefing: string;
}

export interface GridOpsSynergyDefinition {
  id: string;
  assetIds: [string, string];
  label: string;
  bonus: {
    stability: number;
    riskMitigation: number;
    forecast: number;
  };
}

export interface GridOpsMilestone {
  id: string;
  threshold: number;
  title: string;
  description: string;
}

export interface GridOpsRegionDefinition {
  id: string;
  name: string;
  activationThreshold: number;
}

export interface GridOpsStateRow {
  user_id: string;
  scenario_id: GridOpsScenarioId;
  turn_index: number;
  deployed_asset_ids: string[];
  last_deployed_asset_id: string | null;
  spent_units: number;
  scenario_seed: number;
  created_at?: string;
  updated_at?: string;
}

export interface GridOpsResourceSummary {
  earned_units: number;
  spent_units: number;
  available_units: number;
  earned_kwh: number;
  spent_kwh: number;
  available_kwh: number;
}

export interface GridOpsSimulationSummary {
  stability_pct: number;
  blackout_risk_pct: number;
  forecast_confidence_pct: number;
  turn_index: number;
}

export interface GridOpsEventSummary {
  id: string;
  label: string;
  briefing: string;
  turn_offset: number;
  remaining_turns: number;
  affected_region_ids: string[];
}

export interface GridOpsNodeView {
  id: string;
  name: string;
  category: GridOpsAssetCategory;
  position: GridOpsMapPosition;
  isDeployed: boolean;
  state: GridOpsNodeState;
  visual_category?: GridOpsVisualCategory;
  visual_icon?: GridOpsVisualIcon;
  importance?: GridOpsNodeImportance;
  micro_indicator?: GridOpsMicroIndicator;
}

export interface GridOpsEdgeView {
  id: string;
  from: string;
  to: string;
  energized: boolean;
  unstable: boolean;
  tier?: 'backbone' | 'secondary';
}

export interface GridOpsRegionView {
  id: string;
  name: string;
  activationThreshold: number;
  active: boolean;
}

export interface GridOpsAssetView {
  id: string;
  name: string;
  shortLabel: string;
  category: GridOpsAssetCategory;
  description: string;
  unlocks: string;
  status: GridOpsAssetStatus;
  cost_units: number;
  cost_kwh: number;
  effects: GridOpsAssetEffect;
  locked_reason: string | null;
  synergy_hint: string | null;
}

export interface GridOpsMilestonesView {
  current: GridOpsMilestone | null;
  next: GridOpsMilestone | null;
  reached: GridOpsMilestone[];
}

export interface GridOpsRecommendation {
  action: string;
  target_asset_id: string | null;
  missing_units: number;
}

export interface GridOpsComputedState {
  scenario_id: GridOpsScenarioId;
  resources: GridOpsResourceSummary;
  simulation: GridOpsSimulationSummary;
  events: {
    active_event: GridOpsEventSummary;
    next_event: GridOpsEventSummary;
  };
  map: {
    nodes: GridOpsNodeView[];
    edges: GridOpsEdgeView[];
    regions: GridOpsRegionView[];
  };
  assets: GridOpsAssetView[];
  milestones: GridOpsMilestonesView;
  recommendation: {
    next_best_action: GridOpsRecommendation;
  };
  active_synergy_ids: string[];
}

export type GridOpsDeployErrorCode =
  | 'invalid_asset'
  | 'already_deployed'
  | 'locked_asset'
  | 'insufficient_budget';

export interface GridOpsDeployValidationResult {
  ok: boolean;
  errorCode?: GridOpsDeployErrorCode;
  message?: string;
}
