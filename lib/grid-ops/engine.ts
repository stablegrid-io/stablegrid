import { DEFAULT_DEPLOYED_NODE_IDS, unitsToKwh } from '@/lib/energy';
import {
  GRID_OPS_ASSETS,
  GRID_OPS_ASSET_BY_ID,
  GRID_OPS_BASE_FORECAST_CONFIDENCE,
  GRID_OPS_BASE_STABILITY,
  GRID_OPS_DEFAULT_SCENARIO,
  GRID_OPS_EVENTS,
  GRID_OPS_MILESTONES,
  GRID_OPS_REGIONS,
  GRID_OPS_SYNERGIES
} from '@/lib/grid-ops/config';
import {
  resolveEdgeTier,
  resolveNodeVisualHints
} from '@/lib/grid-ops/visualConfig';
import type {
  GridOpsAssetDefinition,
  GridOpsAssetView,
  GridOpsComputedState,
  GridOpsDeployValidationResult,
  GridOpsMilestone,
  GridOpsNodeState,
  GridOpsRecommendation,
  GridOpsScenarioId,
  GridOpsStateRow
} from '@/lib/grid-ops/types';

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

const DEFAULT_DEPLOYED_ASSET_IDS = [...DEFAULT_DEPLOYED_NODE_IDS];

const getAssetName = (assetId: string) => GRID_OPS_ASSET_BY_ID[assetId]?.name ?? assetId;

export const normalizeDeployedAssetIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_DEPLOYED_ASSET_IDS];
  }

  const sanitized = value
    .filter((item): item is string => typeof item === 'string')
    .filter((item) => Boolean(GRID_OPS_ASSET_BY_ID[item]));

  const deduped = Array.from(new Set(sanitized));
  if (deduped.length === 0) {
    return [...DEFAULT_DEPLOYED_ASSET_IDS];
  }

  if (!deduped.includes(DEFAULT_DEPLOYED_ASSET_IDS[0])) {
    deduped.unshift(DEFAULT_DEPLOYED_ASSET_IDS[0]);
  }

  return deduped;
};

export const computeSpentUnits = (deployedAssetIds: string[]) => {
  const normalized = normalizeDeployedAssetIds(deployedAssetIds);
  return normalized.reduce((total, assetId) => {
    const asset = GRID_OPS_ASSET_BY_ID[assetId];
    if (!asset) return total;
    return total + asset.costUnits;
  }, 0);
};

const resolveEventState = (turnIndex: number, scenarioSeed: number) => {
  const cycleLength = GRID_OPS_EVENTS.reduce((sum, event) => sum + event.durationTurns, 0);
  const seedOffset = Math.max(0, Math.floor(scenarioSeed) - 1) % cycleLength;
  const normalizedTurn = ((Math.max(0, turnIndex) + seedOffset) % cycleLength + cycleLength) % cycleLength;

  let cursor = 0;
  let activeIndex = 0;
  let turnOffset = 0;

  for (let index = 0; index < GRID_OPS_EVENTS.length; index += 1) {
    const event = GRID_OPS_EVENTS[index];
    const nextCursor = cursor + event.durationTurns;
    if (normalizedTurn >= cursor && normalizedTurn < nextCursor) {
      activeIndex = index;
      turnOffset = normalizedTurn - cursor;
      break;
    }
    cursor = nextCursor;
  }

  const activeEvent = GRID_OPS_EVENTS[activeIndex];
  const remainingTurns = activeEvent.durationTurns - turnOffset;
  const nextEvent = GRID_OPS_EVENTS[(activeIndex + 1) % GRID_OPS_EVENTS.length];

  return {
    active: {
      id: activeEvent.id,
      label: activeEvent.label,
      briefing: activeEvent.briefing,
      turn_offset: turnOffset,
      remaining_turns: remainingTurns,
      affected_region_ids: activeEvent.affectedRegionIds
    },
    next: {
      id: nextEvent.id,
      label: nextEvent.label,
      briefing: nextEvent.briefing,
      turn_offset: 0,
      remaining_turns: nextEvent.durationTurns,
      affected_region_ids: nextEvent.affectedRegionIds
    },
    activeDefinition: activeEvent
  };
};

const resolveSynergyState = (deployedAssetIds: string[]) => {
  const deployedSet = new Set(deployedAssetIds);
  const matched = GRID_OPS_SYNERGIES.filter((synergy) =>
    synergy.assetIds.every((assetId) => deployedSet.has(assetId))
  );

  const totals = matched.reduce(
    (sum, synergy) => ({
      stability: sum.stability + synergy.bonus.stability,
      riskMitigation: sum.riskMitigation + synergy.bonus.riskMitigation,
      forecast: sum.forecast + synergy.bonus.forecast
    }),
    { stability: 0, riskMitigation: 0, forecast: 0 }
  );

  const highlightedAssetIds = new Set<string>();
  matched.forEach((synergy) => {
    synergy.assetIds.forEach((assetId) => highlightedAssetIds.add(assetId));
  });

  return {
    matched,
    highlightedAssetIds,
    totals
  };
};

const resolveEventMitigation = (
  deployedAssets: GridOpsAssetDefinition[],
  activeEventId: string
) => {
  const eventDefinition = GRID_OPS_EVENTS.find((event) => event.id === activeEventId);
  if (!eventDefinition) {
    return {
      stability: 0,
      riskMitigation: 0,
      forecast: 0
    };
  }

  const favoredCount = deployedAssets.filter((asset) =>
    eventDefinition.favoredCategories.includes(asset.category)
  ).length;

  return {
    stability: favoredCount * 2,
    riskMitigation: favoredCount * 3,
    forecast: favoredCount * 2
  };
};

const resolveNodeState = ({
  isDeployed,
  asset,
  stability,
  synergyAssetIds
}: {
  isDeployed: boolean;
  asset: GridOpsAssetDefinition;
  stability: number;
  synergyAssetIds: Set<string>;
}): GridOpsNodeState => {
  if (!isDeployed) {
    return 'offline';
  }

  if (synergyAssetIds.has(asset.id) || stability >= 110 || asset.effects.stability >= 20) {
    return 'optimized';
  }

  if (stability >= 75 || asset.effects.stability >= 12) {
    return 'stabilized';
  }

  return 'connected';
};

const resolveMilestones = (stabilityPct: number) => {
  const sortedMilestones = [...GRID_OPS_MILESTONES].sort(
    (left, right) => left.threshold - right.threshold
  );

  const reached = sortedMilestones.filter((milestone) => stabilityPct >= milestone.threshold);
  const current = reached.length > 0 ? reached[reached.length - 1] : null;
  const next = sortedMilestones.find((milestone) => stabilityPct < milestone.threshold) ?? null;

  return {
    reached,
    current,
    next
  };
};

const resolveSynergyHint = (assetId: string, deployedAssetIds: string[]) => {
  const deployedSet = new Set(deployedAssetIds);

  const candidate = GRID_OPS_SYNERGIES.find((synergy) => {
    if (!synergy.assetIds.includes(assetId)) {
      return false;
    }

    const [leftId, rightId] = synergy.assetIds;
    const counterpartId = leftId === assetId ? rightId : leftId;
    return deployedSet.has(counterpartId) && !deployedSet.has(assetId);
  });

  if (!candidate) {
    return null;
  }

  const totalBonus =
    candidate.bonus.stability + candidate.bonus.riskMitigation + candidate.bonus.forecast;
  return `${candidate.label} ready (+${totalBonus} total impact)`;
};

const resolveLockedReason = ({
  asset,
  deployedAssetIds,
  availableUnits
}: {
  asset: GridOpsAssetDefinition;
  deployedAssetIds: string[];
  availableUnits: number;
}) => {
  const deployedSet = new Set(deployedAssetIds);

  const missingRequirement = asset.unlockRequirements.find(
    (requirementId) => !deployedSet.has(requirementId)
  );

  if (missingRequirement) {
    return `Requires ${getAssetName(missingRequirement)} first`;
  }

  if (availableUnits < asset.costUnits) {
    const missingUnits = asset.costUnits - availableUnits;
    return `Need ${roundToTwo(unitsToKwh(missingUnits))} kWh more`;
  }

  return null;
};

const resolveAssetViews = ({
  deployedAssetIds,
  availableUnits
}: {
  deployedAssetIds: string[];
  availableUnits: number;
}): GridOpsAssetView[] => {
  const deployedSet = new Set(deployedAssetIds);

  return GRID_OPS_ASSETS.map((asset) => {
    const isDeployed = deployedSet.has(asset.id);
    const lockedReason = isDeployed
      ? null
      : resolveLockedReason({ asset, deployedAssetIds, availableUnits });

    return {
      id: asset.id,
      name: asset.name,
      shortLabel: asset.shortLabel,
      category: asset.category,
      description: asset.description,
      status: isDeployed
        ? 'deployed'
        : lockedReason
          ? 'locked'
          : 'available',
      cost_units: asset.costUnits,
      cost_kwh: roundToTwo(unitsToKwh(asset.costUnits)),
      effects: asset.effects,
      locked_reason: lockedReason,
      synergy_hint: isDeployed ? null : resolveSynergyHint(asset.id, deployedAssetIds)
    };
  });
};

const resolveRecommendation = ({
  assetViews,
  activeEventId,
  deployedAssetIds,
  availableUnits
}: {
  assetViews: GridOpsAssetView[];
  activeEventId: string;
  deployedAssetIds: string[];
  availableUnits: number;
}): GridOpsRecommendation => {
  const activeEvent = GRID_OPS_EVENTS.find((event) => event.id === activeEventId);
  const deployedSet = new Set(deployedAssetIds);

  const candidates = assetViews
    .filter((asset) => asset.status !== 'deployed')
    .map((asset) => {
      const definition = GRID_OPS_ASSET_BY_ID[asset.id];
      const affordable = availableUnits >= asset.cost_units;
      const missingUnits = Math.max(0, asset.cost_units - availableUnits);
      const hasPrereqs = definition.unlockRequirements.every((id) => deployedSet.has(id));

      const favoredBoost =
        activeEvent && activeEvent.favoredCategories.includes(asset.category) ? 12 : 0;
      const synergyBoost = asset.synergy_hint ? 9 : 0;
      const affordabilityPenalty = affordable ? 0 : 26;
      const prereqPenalty = hasPrereqs ? 0 : 40;

      const score =
        asset.effects.stability +
        asset.effects.riskMitigation * 1.4 +
        asset.effects.forecast +
        favoredBoost +
        synergyBoost -
        affordabilityPenalty -
        prereqPenalty;

      return {
        asset,
        affordable,
        hasPrereqs,
        missingUnits,
        score
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.asset.cost_units - right.asset.cost_units;
    });

  const best = candidates[0];
  if (!best) {
    return {
      action: 'Grid is fully optimized. Continue learning to bank reserve kWh.',
      target_asset_id: null,
      missing_units: 0
    };
  }

  if (best.affordable && best.hasPrereqs) {
    if (activeEvent) {
      return {
        action: `Counter ${activeEvent.label}: deploy ${best.asset.name}.`,
        target_asset_id: best.asset.id,
        missing_units: 0
      };
    }

    return {
      action: `Deploy ${best.asset.name} to improve stability and risk margins.`,
      target_asset_id: best.asset.id,
      missing_units: 0
    };
  }

  if (!best.hasPrereqs) {
    const requirement = GRID_OPS_ASSET_BY_ID[best.asset.id].unlockRequirements[0];
    return {
      action: `Unlock ${best.asset.name} by deploying ${getAssetName(requirement)} first.`,
      target_asset_id: requirement,
      missing_units: 0
    };
  }

  return {
    action: `Earn ${roundToTwo(unitsToKwh(best.missingUnits))} kWh more to deploy ${best.asset.name}.`,
    target_asset_id: best.asset.id,
    missing_units: best.missingUnits
  };
};

const isAssetVisibleOnMap = (asset: GridOpsAssetView) => asset.status === 'deployed';

export const ensureStateRowShape = ({
  userId,
  row,
  scenarioId
}: {
  userId: string;
  row: Partial<GridOpsStateRow> | null;
  scenarioId: GridOpsScenarioId;
}): GridOpsStateRow => {
  const deployedAssetIds = normalizeDeployedAssetIds(row?.deployed_asset_ids);

  return {
    user_id: userId,
    scenario_id: scenarioId,
    turn_index: Number.isFinite(row?.turn_index) ? Math.max(0, Number(row?.turn_index)) : 0,
    deployed_asset_ids: deployedAssetIds,
    last_deployed_asset_id:
      typeof row?.last_deployed_asset_id === 'string' &&
      deployedAssetIds.includes(row.last_deployed_asset_id)
        ? row.last_deployed_asset_id
        : null,
    spent_units: Number.isFinite(row?.spent_units)
      ? Math.max(0, Number(row?.spent_units))
      : computeSpentUnits(deployedAssetIds),
    scenario_seed: Number.isFinite(row?.scenario_seed)
      ? Math.max(1, Number(row?.scenario_seed))
      : 1,
    created_at: row?.created_at,
    updated_at: row?.updated_at
  };
};

export const computeGridOpsState = ({
  scenarioId = GRID_OPS_DEFAULT_SCENARIO,
  earnedUnits,
  row
}: {
  scenarioId?: GridOpsScenarioId;
  earnedUnits: number;
  row: GridOpsStateRow;
}): GridOpsComputedState => {
  const deployedAssetIds = normalizeDeployedAssetIds(row.deployed_asset_ids);
  const deployedSet = new Set(deployedAssetIds);
  const deployedAssets = deployedAssetIds
    .map((assetId) => GRID_OPS_ASSET_BY_ID[assetId])
    .filter(Boolean);

  const spentUnits = computeSpentUnits(deployedAssetIds);
  const safeEarnedUnits = Math.max(0, Math.floor(earnedUnits));
  const availableUnits = Math.max(0, safeEarnedUnits - spentUnits);

  const eventState = resolveEventState(row.turn_index, row.scenario_seed);
  const synergyState = resolveSynergyState(deployedAssetIds);
  const eventMitigation = resolveEventMitigation(deployedAssets, eventState.active.id);

  const assetTotals = deployedAssets.reduce(
    (sum, asset) => ({
      stability: sum.stability + asset.effects.stability,
      riskMitigation: sum.riskMitigation + asset.effects.riskMitigation,
      forecast: sum.forecast + asset.effects.forecast
    }),
    { stability: 0, riskMitigation: 0, forecast: 0 }
  );

  const rawStability =
    GRID_OPS_BASE_STABILITY +
    assetTotals.stability +
    synergyState.totals.stability +
    eventMitigation.stability -
    eventState.activeDefinition.modifiers.stabilityPenalty;
  const stabilityPct = clamp(Math.round(rawStability), 0, 120);

  const riskMitigationTotal =
    assetTotals.riskMitigation +
    synergyState.totals.riskMitigation +
    eventMitigation.riskMitigation;
  const rawRisk =
    100 - stabilityPct +
    eventState.activeDefinition.modifiers.riskModifier -
    Math.round(riskMitigationTotal * 0.42);
  const blackoutRiskPct = clamp(Math.round(rawRisk), 0, 100);

  const rawForecast =
    GRID_OPS_BASE_FORECAST_CONFIDENCE +
    assetTotals.forecast +
    synergyState.totals.forecast +
    eventMitigation.forecast -
    eventState.activeDefinition.modifiers.forecastPenalty;
  const forecastConfidencePct = clamp(Math.round(rawForecast), 0, 100);

  const milestones = resolveMilestones(stabilityPct);

  const assetViews = resolveAssetViews({
    deployedAssetIds,
    availableUnits
  });

  const recommendation = resolveRecommendation({
    assetViews,
    activeEventId: eventState.active.id,
    deployedAssetIds,
    availableUnits
  });

  const mapVisibleAssetIds = new Set(
    assetViews.filter((asset) => isAssetVisibleOnMap(asset)).map((asset) => asset.id)
  );

  const nodes = GRID_OPS_ASSETS.filter((asset) => mapVisibleAssetIds.has(asset.id)).map((asset) => {
    const visualHints = resolveNodeVisualHints(asset);

    return {
      id: asset.id,
      name: asset.name,
      category: asset.category,
      position: asset.position,
      isDeployed: deployedSet.has(asset.id),
      state: resolveNodeState({
        isDeployed: deployedSet.has(asset.id),
        asset,
        stability: stabilityPct,
        synergyAssetIds: synergyState.highlightedAssetIds
      }),
      ...visualHints
    };
  });

  const edges = GRID_OPS_ASSETS.flatMap((asset) =>
    asset.connects.map((targetId) => {
      const target = GRID_OPS_ASSET_BY_ID[targetId];
      const energized = deployedSet.has(asset.id) && deployedSet.has(targetId);
      const affectedByEvent = Boolean(
        target &&
          (eventState.active.affected_region_ids.includes(asset.position.regionId) ||
            eventState.active.affected_region_ids.includes(target.position.regionId))
      );

      return {
        id: `${asset.id}:${targetId}`,
        from: asset.id,
        to: targetId,
        energized,
        unstable: energized && blackoutRiskPct >= (affectedByEvent ? 35 : 55),
        tier: resolveEdgeTier({
          fromAsset: asset,
          toAsset: target ?? null
        })
      };
    })
  ).filter((edge) => mapVisibleAssetIds.has(edge.from) && mapVisibleAssetIds.has(edge.to));

  const regions = GRID_OPS_REGIONS.map((region) => ({
    id: region.id,
    name: region.name,
    activationThreshold: region.activationThreshold,
    active: stabilityPct >= region.activationThreshold
  }));

  return {
    scenario_id: scenarioId,
    resources: {
      earned_units: safeEarnedUnits,
      spent_units: spentUnits,
      available_units: availableUnits,
      earned_kwh: roundToTwo(unitsToKwh(safeEarnedUnits)),
      spent_kwh: roundToTwo(unitsToKwh(spentUnits)),
      available_kwh: roundToTwo(unitsToKwh(availableUnits))
    },
    simulation: {
      stability_pct: stabilityPct,
      blackout_risk_pct: blackoutRiskPct,
      forecast_confidence_pct: forecastConfidencePct,
      turn_index: row.turn_index
    },
    events: {
      active_event: eventState.active,
      next_event: eventState.next
    },
    map: {
      nodes,
      edges,
      regions
    },
    assets: assetViews,
    milestones: {
      current: milestones.current,
      next: milestones.next,
      reached: milestones.reached
    },
    recommendation: {
      next_best_action: recommendation
    },
    active_synergy_ids: synergyState.matched.map((synergy) => synergy.id)
  };
};

export const validateDeployAction = ({
  assetId,
  deployedAssetIds,
  availableUnits
}: {
  assetId: string;
  deployedAssetIds: string[];
  availableUnits: number;
}): GridOpsDeployValidationResult => {
  const asset = GRID_OPS_ASSET_BY_ID[assetId];
  if (!asset) {
    return {
      ok: false,
      errorCode: 'invalid_asset',
      message: 'Asset is not defined for this scenario.'
    };
  }

  const normalizedDeployed = normalizeDeployedAssetIds(deployedAssetIds);
  const deployedSet = new Set(normalizedDeployed);

  if (deployedSet.has(assetId)) {
    return {
      ok: false,
      errorCode: 'already_deployed',
      message: 'Asset is already deployed.'
    };
  }

  const missingRequirement = asset.unlockRequirements.find(
    (requirement) => !deployedSet.has(requirement)
  );

  if (missingRequirement) {
    return {
      ok: false,
      errorCode: 'locked_asset',
      message: `Asset is locked. Deploy ${getAssetName(missingRequirement)} first.`
    };
  }

  if (availableUnits < asset.costUnits) {
    return {
      ok: false,
      errorCode: 'insufficient_budget',
      message: `Insufficient kWh. Need ${roundToTwo(unitsToKwh(asset.costUnits - availableUnits))} more.`
    };
  }

  return { ok: true };
};

export const applyDeployAction = ({
  row,
  assetId
}: {
  row: GridOpsStateRow;
  assetId: string;
}): GridOpsStateRow => {
  const normalizedDeployed = normalizeDeployedAssetIds(row.deployed_asset_ids);
  const nextDeployedAssetIds = [...normalizedDeployed, assetId];

  return {
    ...row,
    deployed_asset_ids: nextDeployedAssetIds,
    last_deployed_asset_id: assetId,
    spent_units: computeSpentUnits(nextDeployedAssetIds),
    turn_index: row.turn_index + 1
  };
};

export const resolveMilestoneUnlock = ({
  before,
  after
}: {
  before: GridOpsMilestone | null;
  after: GridOpsMilestone | null;
}) => {
  if (!after) return null;
  if (!before) return after;

  return after.threshold > before.threshold ? after : null;
};

export const normalizeScenarioId = (value: unknown): GridOpsScenarioId => {
  if (value === GRID_OPS_DEFAULT_SCENARIO) {
    return value;
  }

  return GRID_OPS_DEFAULT_SCENARIO;
};
