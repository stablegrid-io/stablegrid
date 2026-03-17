/**
 * Incident Engine — Phase 1
 *
 * Pure helper functions (no DB) for computing asset health,
 * plus async DB helpers for the server-side incident lifecycle.
 */

import type { GridOpsAssetCategory } from './types';
import type { GridOpsIncidentRow, GridOpsIncidentSeverity, GridOpsIncidentType } from './types';
import type { GridOpsStateRow } from './types';
import {
  INCIDENT_ESCALATION_HOURS,
  INCIDENT_HEALTH_PCT,
  INCIDENT_REPAIR_COSTS
} from './incidentNarratives';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ACTIVE_INCIDENTS = 3;
const INCIDENT_GENERATE_EVERY_N_TURNS = 4; // generate one new incident every N deploys
const MIN_STABILITY_TO_GENERATE = 35;       // don't pile on when the grid is already failing

// ─── Category → incident type mapping ────────────────────────────────────────

const CATEGORY_INCIDENT_MAP: Record<GridOpsAssetCategory, GridOpsIncidentType[]> = {
  monitoring: ['communication_loss'],
  control: ['voltage_fluctuation', 'frequency_instability'],
  forecasting: ['forecasting_gap'],
  flexibility: ['reserve_shortage'],
  reinforcement: ['transformer_overload', 'cascade_risk']
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a map of assetId → healthPct for all active (unresolved) incidents.
 * Healthy assets are not included — callers should treat absence as 100%.
 */
export const getAssetHealthMap = (
  incidents: GridOpsIncidentRow[]
): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const incident of incidents) {
    if (incident.resolved_at !== null) continue;
    map[incident.asset_id] = INCIDENT_HEALTH_PCT[incident.severity];
  }
  return map;
};

/**
 * Returns true when a new incident should be generated on this state fetch.
 */
export const shouldGenerateIncident = ({
  turnIndex,
  stabilityPct,
  activeCount
}: {
  turnIndex: number;
  stabilityPct: number;
  activeCount: number;
}): boolean => {
  if (turnIndex <= 0) return false;
  if (turnIndex % INCIDENT_GENERATE_EVERY_N_TURNS !== 0) return false;
  if (stabilityPct < MIN_STABILITY_TO_GENERATE) return false;
  if (activeCount >= MAX_ACTIVE_INCIDENTS) return false;
  return true;
};

/**
 * Picks a deployed asset that doesn't already have an active incident.
 * Returns { assetId, incidentType } or null if no eligible assets.
 */
export const pickIncidentAsset = ({
  deployedAssetIds,
  assetCategoryById,
  activeIncidents,
  scenarioSeed
}: {
  deployedAssetIds: string[];
  assetCategoryById: Record<string, GridOpsAssetCategory>;
  activeIncidents: GridOpsIncidentRow[];
  scenarioSeed: number;
}): { assetId: string; incidentType: GridOpsIncidentType } | null => {
  const activeAssetIds = new Set(
    activeIncidents.filter((i) => i.resolved_at === null).map((i) => i.asset_id)
  );

  // Eligible = deployed, not already afflicted, not control-center (too dramatic)
  const eligible = deployedAssetIds.filter(
    (id) => !activeAssetIds.has(id) && id !== 'control-center'
  );

  if (eligible.length === 0) return null;

  // Use scenarioSeed + activeCount as a deterministic selector
  const index = (scenarioSeed + activeIncidents.length) % eligible.length;
  const assetId = eligible[index];
  const category = assetCategoryById[assetId] ?? 'monitoring';
  const typeOptions = CATEGORY_INCIDENT_MAP[category] ?? ['communication_loss'];

  // Alternate between options based on seed parity
  const typeIndex = scenarioSeed % typeOptions.length;
  const incidentType = typeOptions[typeIndex];

  return { assetId, incidentType };
};

/**
 * Builds the payload for an incident INSERT (excluding id + created_at).
 */
export const buildIncidentPayload = ({
  userId,
  scenarioId,
  assetId,
  incidentType,
  severity = 'warning'
}: {
  userId: string;
  scenarioId: string;
  assetId: string;
  incidentType: GridOpsIncidentType;
  severity?: GridOpsIncidentSeverity;
}): Omit<GridOpsIncidentRow, 'id' | 'created_at'> => {
  const repairCost = INCIDENT_REPAIR_COSTS[severity];
  const escalationHours = INCIDENT_ESCALATION_HOURS[severity];
  const escalatesAt = escalationHours
    ? new Date(Date.now() + escalationHours * 3_600_000).toISOString()
    : null;

  return {
    user_id: userId,
    scenario_id: scenarioId,
    asset_id: assetId,
    incident_type: incidentType,
    severity,
    health_penalty_pct: 100 - INCIDENT_HEALTH_PCT[severity],
    repair_cost_units: repairCost,
    started_at: new Date().toISOString(),
    escalates_at: escalatesAt,
    resolved_at: null
  };
};

// ─── DB helpers ───────────────────────────────────────────────────────────────

/**
 * Escalates incidents whose escalates_at has passed.
 * warning → critical → offline (terminal).
 */
export const escalateExpiredIncidents = async (
  supabase: any,
  userId: string,
  scenarioId: string
): Promise<void> => {
  const now = new Date().toISOString();

  // Fetch incidents that need escalation
  const { data: toEscalate } = await supabase
    .from('incidents')
    .select('id, severity')
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .is('resolved_at', null)
    .lt('escalates_at', now);

  if (!toEscalate || toEscalate.length === 0) return;

  for (const row of toEscalate) {
    const nextSeverity: GridOpsIncidentSeverity =
      row.severity === 'warning' ? 'critical' : 'offline';
    const nextEscalationHours = INCIDENT_ESCALATION_HOURS[nextSeverity];
    const nextEscalatesAt = nextEscalationHours
      ? new Date(Date.now() + nextEscalationHours * 3_600_000).toISOString()
      : null;

    await supabase
      .from('incidents')
      .update({
        severity: nextSeverity,
        health_penalty_pct: 100 - INCIDENT_HEALTH_PCT[nextSeverity],
        repair_cost_units: INCIDENT_REPAIR_COSTS[nextSeverity],
        escalates_at: nextEscalatesAt
      })
      .eq('id', row.id);
  }
};

/**
 * Fetches all active (unresolved) incidents for this user + scenario.
 */
export const fetchActiveIncidents = async (
  supabase: any,
  userId: string,
  scenarioId: string
): Promise<GridOpsIncidentRow[]> => {
  const { data, error } = await supabase
    .from('incidents')
    .select(
      'id,user_id,scenario_id,asset_id,incident_type,severity,health_penalty_pct,repair_cost_units,started_at,escalates_at,resolved_at'
    )
    .eq('user_id', userId)
    .eq('scenario_id', scenarioId)
    .is('resolved_at', null);

  if (error) throw new Error(error.message);
  return (data as GridOpsIncidentRow[]) ?? [];
};

/**
 * Generates a new incident if the current state warrants one.
 * Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates (the unique partial
 * index on incidents prevents two active incidents on the same asset).
 */
export const generateIncidentIfNeeded = async (
  supabase: any,
  userId: string,
  scenarioId: string,
  stateRow: GridOpsStateRow,
  activeIncidents: GridOpsIncidentRow[],
  stabilityPct: number,
  assetCategoryById: Record<string, GridOpsAssetCategory>
): Promise<void> => {
  if (
    !shouldGenerateIncident({
      turnIndex: stateRow.turn_index,
      stabilityPct,
      activeCount: activeIncidents.length
    })
  ) {
    return;
  }

  const pick = pickIncidentAsset({
    deployedAssetIds: stateRow.deployed_asset_ids,
    assetCategoryById,
    activeIncidents,
    scenarioSeed: stateRow.scenario_seed
  });

  if (!pick) return;

  const payload = buildIncidentPayload({
    userId,
    scenarioId,
    assetId: pick.assetId,
    incidentType: pick.incidentType,
    severity: 'warning'
  });

  // ON CONFLICT DO NOTHING is handled by the unique partial index
  await supabase.from('incidents').insert(payload);
  // We don't throw on error here — if the conflict fires, that's fine.
};
