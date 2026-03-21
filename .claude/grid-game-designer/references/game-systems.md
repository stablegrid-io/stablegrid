# Game Systems — Full Technical Reference

## Project root
`/Users/nedasvaitkus/Desktop/grid`

---

## 1. Economy

### Units & kWh conversion
```
ENERGY_UNITS_PER_KWH = 1000
unitsToKwh(units) = units / 1000
kwhToUnits(kwh)   = Math.round(kwh * 1000)
```

### How players earn kWh
| Action | kWh |
|---|---|
| Flashcard correct | 0.02 kWh (20 units) |
| Flashcard streak milestone (5/10/20/30/50) | 0.30 kWh (300 units) |
| Mission Medium | 0.40 kWh (400 units) |
| Mission Hard | 1.40 kWh (1400 units) |
| Mission Expert | 2.40 kWh (2400 units) |
| Chapter completion | 0.15 kWh (150 units) |
| Dispatch call rewards | 200–1500 units (see §5) |

kWh is stored as `xp` (integer units) in `user_progress.xp`.

---

## 2. Assets (Infrastructure Nodes)

All 9 assets are in `lib/energy.ts → INFRASTRUCTURE_NODES`, augmented in `lib/grid-ops/config.ts`.
Linear unlock chain — each asset requires the previous.

| ID | Name | Cost | Stability | Risk Mitigation | Forecast | Category |
|---|---|---|---|---|---|---|
| control-center | Control Center | 0 kWh | +5 | 4 | 10 | monitoring |
| smart-transformer | Smart Transformer | 2 kWh | +8 | 6 | 3 | control |
| solar-forecasting-array | Solar Forecasting Array | 3 kWh | +10 | 5 | 19 | forecasting |
| battery-storage | Battery Storage | 5 kWh | +15 | 11 | 2 | flexibility |
| frequency-controller | Frequency Controller | 7 kWh | +12 | 14 | 4 | control |
| demand-response-system | Demand Response System | 10 kWh | +18 | 16 | 3 | flexibility |
| grid-flywheel | Grid Flywheel | 12 kWh | +14 | 10 | 2 | control |
| hvdc-interconnector | HVDC Interconnector | 15 kWh | +20 | 12 | 6 | reinforcement |
| ai-grid-optimizer | AI Grid Optimizer | 18 kWh | +25 | 17 | 22 | forecasting |

Total cost to deploy all 9 = 72 kWh. control-center is always deployed (free).

### Asset categories
`monitoring | control | forecasting | flexibility | reinforcement`

### Map regions (x-axis based)
- western-corridor: x < 400 — activates at stability 25%
- central-mesh: 400 ≤ x < 700 — activates at stability 50%
- eastern-demand: x ≥ 700 — activates at stability 75%
- interconnect-ring — activates at stability 100%
- optimization-layer — activates at stability 110%

---

## 3. Stability Formula

```
BASE_STABILITY = 38
BASE_FORECAST_CONFIDENCE = 24

rawStability = BASE_STABILITY
             + sum(asset.effects.stability for each deployed asset)
             + sum(synergy.bonus.stability for each active synergy)
             + eventMitigation.stability  (favored category assets × 2 each)
             − event.modifiers.stabilityPenalty

incidentPenalty = sum(deployed assets: (100 − healthPct) / 100 × 30)
  // warning: 7.5 per asset, critical: 15, offline: 24 (max)

stabilityPct = clamp(round(rawStability − incidentPenalty), 0, 120)
blackoutRiskPct = clamp(100 − stability + event.riskModifier − riskMitigationTotal × 0.42, 0, 100)
forecastConfidencePct = clamp(BASE(24) + Σforecast + synergy.forecast + mitigation.forecast − event.forecastPenalty, 0, 100)
```

### Full deployment (all 9 assets, no incidents, Cloud Cover Surge)
rawStability = 38 + 127(all assets) + 19(synergies) − 7(event) = 177 → clamped to 120

---

## 4. Synergies

| ID | Assets | +stability | +risk | +forecast |
|---|---|---|---|---|
| solar-battery-synergy | solar-forecasting-array + battery-storage | +6 | +8 | +5 |
| control-transformer-synergy | control-center + smart-transformer | +4 | +5 | +2 |
| demand-battery-synergy | demand-response-system + battery-storage | +5 | +10 | +2 |
| interconnector-ai-synergy | hvdc-interconnector + ai-grid-optimizer | +8 | +7 | +9 |

---

## 5. Events (cycle: 6 turns total)

| ID | Label | Duration | Stability penalty | Risk modifier | Forecast penalty | Favored categories |
|---|---|---|---|---|---|---|
| cloud_cover_surge | Cloud Cover Surge | 2 turns | −7 | +10 | −13 | forecasting |
| evening_peak | Evening Peak | 2 turns | −9 | +14 | −3 | flexibility, control |
| wind_ramp | Wind Ramp Event | 2 turns | −6 | +9 | −8 | control, forecasting |

---

## 6. Milestones

| Threshold | Title |
|---|---|
| 25% | Regional Monitoring Restored |
| 50% | Grid Coordination Online |
| 75% | Variability Controlled |
| 100% | Iberian Grid Stabilized |
| 110% | Optimization Phase |

---

## 7. Incident System

Repair costs: warning=500u, critical=1200u, offline=2800u
Escalation: warning→critical in 24h, critical→offline in 12h, offline is terminal
Health %: warning=75%, critical=50%, offline=20%
Generation: every 4 turns, only if stability≥35, activeCount<3, turnIndex>0
control-center is immune (never targeted)

Category → incident type mapping:
- monitoring → communication_loss
- control → voltage_fluctuation, frequency_instability
- forecasting → forecasting_gap
- flexibility → reserve_shortage
- reinforcement → transformer_overload, cascade_risk

All 7 incident types: voltage_fluctuation, frequency_instability, transformer_overload,
forecasting_gap, reserve_shortage, cascade_risk, communication_loss

Dispatcher message format: "Dispatcher: [state]. [risk]. [action]."

---

## 8. Dispatch Calls (iberia_v1)

| ID | Title | stability_min | turn_min | Reward |
|---|---|---|---|---|
| iberia_v1_call_01 | First Contact | 0% | 0 | 200 units |
| iberia_v1_call_02 | Stability Report | 60% | 3 | 400 units |
| iberia_v1_call_03 | Cascade Warning | 55% | 6 | 600 units |
| iberia_v1_call_04 | Renewable Integration | 72% | 9 | 800 units |
| iberia_v1_call_05 | Optimal State | 90% | 12 | 1500 units |

---

## 9. Key Files

| What to change | File |
|---|---|
| Asset stats / costs | lib/energy.ts (INFRASTRUCTURE_NODES) |
| Asset category / effects overrides | lib/grid-ops/config.ts |
| Events | lib/grid-ops/config.ts → GRID_OPS_EVENTS |
| Milestones | lib/grid-ops/config.ts → GRID_OPS_MILESTONES |
| Synergies | lib/grid-ops/config.ts → GRID_OPS_SYNERGIES |
| Incident messages / costs | lib/grid-ops/incidentNarratives.ts |
| Incident logic | lib/grid-ops/incidentEngine.ts |
| Incident types (TypeScript) | lib/grid-ops/types.ts |
| Dispatch call content | lib/grid-ops/dispatchCallContent.ts |
| Stability computation (pure) | lib/grid-ops/engine.ts |
| State API | app/api/grid-ops/state/route.ts |
| Deploy API | app/api/grid-ops/action/route.ts |
| Repair API | app/api/grid-ops/incident/repair/route.ts |
| Dispatch complete API | app/api/grid-ops/dispatch/complete/route.ts |
| Map rendering | components/grid-ops/GridMapCanvas.tsx |
| Main experience | components/grid-ops/GridOpsExperience.tsx |
| Mission sidebar | components/grid-ops/MissionControlDrawer.tsx |
| Incident modal | components/grid-ops/IncidentAlertModal.tsx |
| Dispatch call modal | components/grid-ops/DispatchCallModal.tsx |
| Migrations | supabase/migrations/ |

---

## 10. Design Constraints

1. computeGridOpsState is pure — no DB calls inside it
2. Supabase RPCs for any operation that deducts XP + modifies game state atomically
3. Migrations are append-only — never modify existing files
4. Scenario IDs match content ID prefixes (iberia_v1_call_XX)
5. 1000 units = 1 kWh everywhere — always use unitsToKwh / kwhToUnits
6. Rate limits on all write API routes
7. Run npx tsc --noEmit after type changes
