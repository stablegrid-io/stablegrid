import type { GridOpsIncidentSeverity, GridOpsIncidentType } from './types';

// ─── Repair costs by severity ─────────────────────────────────────────────────

export const INCIDENT_REPAIR_COSTS: Record<GridOpsIncidentSeverity, number> = {
  warning: 500,
  critical: 1200,
  offline: 2800
};

// ─── Escalation window in hours (null = terminal severity) ───────────────────

export const INCIDENT_ESCALATION_HOURS: Record<GridOpsIncidentSeverity, number | null> = {
  warning: 24,
  critical: 12,
  offline: null
};

// ─── Node health percentage by severity ──────────────────────────────────────

export const INCIDENT_HEALTH_PCT: Record<GridOpsIncidentSeverity, number> = {
  warning: 75,
  critical: 50,
  offline: 20
};

// ─── Dispatcher dialogue by type × severity ──────────────────────────────────

export const INCIDENT_NARRATIVES: Record<
  GridOpsIncidentType,
  Record<GridOpsIncidentSeverity, string>
> = {
  voltage_fluctuation: {
    warning:
      'Dispatcher: Voltage readings are drifting on the substation. Not critical yet — stabilize it before the afternoon peak.',
    critical:
      'Dispatcher: That voltage swing just tripped a relay. We\'re burning reserve capacity. Repair window is closing fast.',
    offline:
      'Dispatcher: Substation is offline. We\'ve lost the node. Repair now or cascade risk spikes.'
  },
  frequency_instability: {
    warning:
      'Dispatcher: 50 Hz is wavering. Minor, but worth watching — frequency drift is how blackouts start.',
    critical:
      'Dispatcher: Frequency is outside safe band. Auto-protection schemes are arming. Repair before they trigger.',
    offline:
      'Dispatcher: Frequency node is down. Grid is running open-loop. This is how we lose the whole system.'
  },
  transformer_overload: {
    warning:
      'Dispatcher: Transformer load is above design rating. It\'ll hold for now, but thermal runaway is possible.',
    critical:
      'Dispatcher: Transformer is hot — thermal sensors are redlining. Offline is the next stop if this isn\'t fixed.',
    offline:
      'Dispatcher: Transformer tripped on overtemperature. Repair before we lose the downstream ring.'
  },
  forecasting_gap: {
    warning:
      'Dispatcher: Forecast accuracy has dropped. We\'re flying half-blind. Less confidence, more reserves needed.',
    critical:
      'Dispatcher: Forecasting model is failing. Dispatch decisions are guesswork right now. Fix the data link.',
    offline:
      'Dispatcher: Forecasting node is dark. We have no visibility on demand. Emergency mode engaged.'
  },
  reserve_shortage: {
    warning:
      'Dispatcher: Reserve margin is thinning. One unplanned outage and we have nothing to catch it with.',
    critical:
      'Dispatcher: We\'re operating below minimum reserve. A single fault will cascade. Repair this now.',
    offline:
      'Dispatcher: Reserve storage is offline. Zero buffer. Any disturbance and we lose the grid.'
  },
  cascade_risk: {
    warning:
      'Dispatcher: Cascade protection logic has flagged a weak point. Low risk now, but monitor closely.',
    critical:
      'Dispatcher: Cascade fault is propagating. We have minutes before it jumps to the backbone. Move fast.',
    offline:
      'Dispatcher: Cascade node is offline. Fault isolation failed. Repair or we start shedding load.'
  },
  communication_loss: {
    warning:
      'Dispatcher: SCADA is dropping packets to the eastern zone. Telemetry is degraded. Get comms restored.',
    critical:
      'Dispatcher: Communication blackout — we can\'t monitor two substations. Operating blind on east link.',
    offline:
      'Dispatcher: SCADA link is down. We\'ve lost visibility and control. Restore comms before anything else.'
  }
};

export const getDispatcherMessage = (
  type: GridOpsIncidentType,
  severity: GridOpsIncidentSeverity
): string => INCIDENT_NARRATIVES[type][severity];
