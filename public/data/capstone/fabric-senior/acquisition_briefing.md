# Acquisition Briefing — GridUnion Continental Expansion

**From:** Olivia Lund, VP Platform Engineering, GridUnion Continental
**To:** Lead Fabric Architect (you)
**Date:** 2026-04-02 (Day 1 of the 90-day window)
**Classification:** Internal / Platform Engineering

---

## Decision

On 2026-03-31, the GridUnion Continental board approved the acquisition of two
additional grid operators:

- **SaulėGrid** — Vilnius-headquartered Lithuanian solar operator.
  Regulator: **VERT-LT** (Valstybinė energetikos reguliavimo taryba).
- **HydroAlpes** — Innsbruck-headquartered Austrian hydroelectric operator.
  Regulator: **E-Control AT** (Energie-Control Austria).

Closing date is **2026-07-01**. The CTO has given the Platform Engineering
team **90 days from today** to produce an architecture that onboards both
operators onto GridUnion's existing Fabric tenant **without rebuilding what
Germany, France, Netherlands, and Luxembourg already run in production**.

This document is the hand-off. I expect deliverables back from you by **Day 90
(2026-07-01)**: a design recommendation, a migration plan, a governance policy,
and a CTO-level brief.

---

## Combined scale post-acquisition

| Dimension | GridUnion today (DE, FR, NL, LU) | + SaulėGrid (LT) | + HydroAlpes (AT) | **Combined** | Δ |
|---|---|---|---|---|---|
| Countries | 4 | +1 | +1 | **6** | +50% |
| Meters | 5,000,000 | +820,000 | +1,250,000 | **7,070,000** | +41% |
| Regions | 30 | +5 | +8 | **43** | +43% |
| Data engineering teams | 4 | +1 | +1 | **6** | +50% |
| All teams (eng + analytics + ML + compliance + platform) | 12 | +2 | +3 | **17** | +42% |
| Turbines / generation assets | 20,000 wind | +2,400 solar arrays | +310 hydro units | **mixed** | n/a |
| Daily stream events | 172M | +48M (solar telemetry @ 10s) | +22M (dam sensor @ 30s) | **242M** | +41% |
| Regulatory regimes | 4 (BNetzA, CRE, ACM, ILR) | +VERT-LT | +E-Control AT | **6** | +50% |
| Workspaces (current / projected) | 78 | ~14 projected | ~21 projected | **~113** | +45% |

The two acquisitions are asymmetric:

- **SaulėGrid is small but stream-heavy.** 820K meters is a modest data volume,
  but their **solar forecasting product samples at 10-second granularity** —
  adding ~48M daily stream events to the Eventstream hub (a **28% increase on
  the streaming capacity's current peak load**).
- **HydroAlpes is larger and more regulated.** 1.25M meters in 8 regions, and
  Austria's E-Control requires a **`balancing_zone_id`** column on every meter
  reading (Austria maps consumption to 5 balancing zones for grid cost
  allocation). Lithuania's VERT-LT requires a **`grid_operator_license_id`**
  column for each reading as well. These are regulator-mandated additions; we
  cannot normalise them away.

---

## Evidence pack you have been given

All six files live under `PJFabric_Senior_data/evidence/`:

1. **pipeline_inventory.csv** — every pipeline currently running on the
   GridUnion tenant (80 rows). Use this to understand what exists today.
2. **workspace_inventory.csv** — every workspace (78 rows) with its attached
   capacity, owning team, and storage footprint.
3. **table_catalog.csv** — every production Delta and Warehouse table (128
   rows) with schema version, contract status, and dependent pipeline count.
4. **capacity_metrics.csv** — weekly peak/p95 utilization and throttling
   events for each of the four capacities, six weeks of history.
5. **incident_history.csv** — every severity-1/2/3 production incident from
   2025-07 through 2026-03 (24 rows) with root-cause summaries.
6. **current_governance_policy.md** — the governance document that was
   adequate for a single-country platform. Read with Chapter 4 in mind.

---

## What I expect in each of your five chapters

### Chapter 1 — Audit the Current State

Pick the **top three technical risks** that become critical at the combined
scale. Cite the specific evidence row for each risk. Then rank them. I want
your ranking in the design journal by end of Day 14, so the Chapter 2 working
session can use it.

### Chapter 2 — Design the Onboarding Architecture

Three options are on the whiteboard (see the Chapter 2 brief). Recommend one.
Justify against the four criteria the CTO named in last week's review:
**regulatory isolation, onboarding speed, capacity cost, and team autonomy**.
Document two trade-offs you are explicitly accepting. Multiple defensible
answers exist — I care about the quality of the reasoning, not the label of
the option.

### Chapter 3 — Plan the Migration

Given the pipelines that will need restructuring under your chosen architecture,
produce a three-wave migration plan (**Wave 1: days 1-30, Wave 2: days 31-60,
Wave 3: days 61-90**). Each pipeline goes into exactly one wave. The wave
assignment must be defensible against three constraints:
**SLA tier, consumer count, and CU cost**.

### Chapter 4 — Write the Governance Policy

Our current governance document is in `current_governance_policy.md`. It was
written for a one-country platform by a team of 15 and is visibly inadequate
for six countries and 80 engineers. Identify **three gaps** that the
acquisition will expose, and write the policy additions. Each addition needs
**four fields: scope, trigger, enforcement mechanism, and owner**.

### Chapter 5 — The CTO Deck

A five-section executive brief for Pete (CTO): **Situation, Options Considered,
Recommendation, Timeline, Risks**. Each section pre-populates from your
design journal — the three risks from Chapter 1, the option you chose in
Chapter 2, the wave plan from Chapter 3, the policy gaps from Chapter 4. If
something in your Chapter 5 contradicts your earlier chapters, the rubric
will flag the inconsistency. A different recommendation in Chapter 5 than
in Chapter 2 is acceptable **only if you explain what changed**.

---

## One reminder

I do not need a perfect answer. I need a **defensible** answer. Senior
architects get paid to make calls on incomplete evidence and then live with
the consequences of their reasoning. Be explicit about what you are choosing,
what you are rejecting, and what you would want to revisit in 12 months.

— Olivia
