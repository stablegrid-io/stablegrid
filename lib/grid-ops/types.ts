export type GridOpsScenarioId =
  | 'lithuania_v1'
  | 'iberia_v1'
  | 'nordic_v1'
  | 'germany_v1'
  | 'europe_v1';

// ─── Campaign ──────────────────────────────────────────────────────────────────

export interface GridOpsCampaignScenario {
  id: GridOpsScenarioId;
  order: number;
  name: string;        // "Lithuania"
  subtitle: string;    // "Baltic Grid Crisis"
  description: string;
  flag: string;        // emoji flag
  completionThreshold: number; // stability_pct required to complete
  unlockAfter: GridOpsScenarioId | null; // null = always unlocked (first mission)
}

export type GridOpsCampaignState = 'locked' | 'available' | 'in_progress' | 'completed';

export interface GridOpsCampaignScenarioProgress {
  scenario: GridOpsCampaignScenario;
  state: GridOpsCampaignState;
  stability_pct: number | null; // null if not started
  deployed_count: number;
}

export interface GridOpsCampaignView {
  scenarios: GridOpsCampaignScenarioProgress[];
}

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
  completed_dispatch_call_ids: string[];
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
  health_pct?: number; // undefined = healthy; 75=warning, 50=critical, 20=offline
}

export interface GridOpsEdgeView {
  id: string;
  from: string;
  to: string;
  energized: boolean;
  unstable: boolean;
  tier?: 'backbone' | 'secondary';
}

export type GridOpsRegionStatus = 'inactive' | 'active' | 'threatened' | 'dark';

export interface GridOpsRegionView {
  id: string;
  name: string;
  activationThreshold: number;
  active: boolean;
  status: GridOpsRegionStatus;
  asset_ids: string[];   // deployed assets currently in this region
  threat_count: number;  // active incidents in this region
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
  incidents: GridOpsIncidentView[];
  dispatch_calls: GridOpsDispatchCallView[];
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

// ─── Incident System ──────────────────────────────────────────────────────────

export type GridOpsIncidentType =
  | 'voltage_fluctuation'
  | 'frequency_instability'
  | 'transformer_overload'
  | 'forecasting_gap'
  | 'reserve_shortage'
  | 'cascade_risk'
  | 'communication_loss';

export type GridOpsIncidentSeverity = 'warning' | 'critical' | 'offline';

/** Raw DB row from the `incidents` table. */
export interface GridOpsIncidentRow {
  id: string;
  user_id: string;
  scenario_id: string;
  asset_id: string;
  incident_type: GridOpsIncidentType;
  severity: GridOpsIncidentSeverity;
  health_penalty_pct: number;
  repair_cost_units: number;
  started_at: string;
  escalates_at: string | null;
  resolved_at: string | null;
}

/** Computed view embedded in GridOpsComputedState. */
export interface GridOpsIncidentView {
  id: string;
  asset_id: string;
  asset_name: string;
  incident_type: GridOpsIncidentType;
  severity: GridOpsIncidentSeverity;
  health_pct: number; // 75=warning, 50=critical, 20=offline
  repair_cost_units: number;
  dispatcher_message: string;
  started_at: string;
  escalates_at: string | null;
}

// ─── Dispatch Calls ───────────────────────────────────────────────────────────

export interface GridOpsDispatchCallView {
  id: string;
  title: string;
  summary: string;
  dialogue: string[];
  reward_units: number;
  completed: boolean;
}
