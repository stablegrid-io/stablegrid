'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { GRID_OPS_CAMPAIGN } from '@/lib/grid-ops/config';
import { GRID_SCENE_ANIMATION_CONFIG } from '@/lib/grid-ops/sceneAnimationConfig';
import type { GridOpsComputedState, GridOpsMilestone, GridOpsDispatchCallView, GridOpsRegionStatus, GridOpsRegionView, GridOpsScenarioId } from '@/lib/grid-ops/types';
import { RegionDarkToast } from '@/components/grid-ops/RegionDarkToast';
import {
  trackProductEvent,
  trackProductEventOnce
} from '@/lib/analytics/productAnalytics';
import { createGridOpsDeployRequestKey } from '@/lib/api/requestKeys';
import { MilestoneToast } from '@/components/grid-ops/MilestoneToast';
import { MissionControlDrawer } from '@/components/grid-ops/MissionControlDrawer';
import { GridSceneErrorBoundary } from '@/components/grid-ops/scene/GridSceneErrorBoundary';
import { GridSceneCanvas } from '@/components/grid-ops/scene/GridSceneCanvas';
import { GridMapCanvas } from '@/components/grid-ops/GridMapCanvas';
import { VoltageZoneMap } from '@/components/grid-ops/VoltageZoneMap';
import { TechDeckDock } from '@/components/grid-ops/TechDeckDock';
import { IncidentAlertModal } from '@/components/grid-ops/IncidentAlertModal';
import { DispatchCallModal } from '@/components/grid-ops/DispatchCallModal';
import { DispatcherPanel } from '@/components/dispatcher/DispatcherPanel';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { useGridOpsStore } from '@/lib/stores/useGridOpsStore';
import { detectWebGLSupport } from '@/lib/grid-ops/webglSupport';

interface StateResponse {
  data: GridOpsComputedState;
}

interface ActionResponse {
  data: {
    before_state: GridOpsComputedState;
    after_state: GridOpsComputedState;
    delta: {
      stability: number;
      risk: number;
      budget_units: number;
    };
    milestone_unlocked: GridOpsMilestone | null;
    activated_regions: string[];
  };
  error?: string;
}

const GRID_SCENE_DISABLE = process.env.NEXT_PUBLIC_GRID_SCENE_DISABLE === 'true';

interface GridOpsExperienceProps {
  scenarioId: GridOpsScenarioId;
}

export function GridOpsExperience({ scenarioId }: GridOpsExperienceProps) {
  const router = useRouter();
  const scenarioDef = GRID_OPS_CAMPAIGN.find((s) => s.id === scenarioId);
  const [state, setState] = useState<GridOpsComputedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webglSupported, setWebglSupported] = useState(false);
  const [pendingAssetId, setPendingAssetId] = useState<string | null>(null);
  const [highlightedAssetId, setHighlightedAssetId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [deployingAssetId, setDeployingAssetId] = useState<string | null>(null);
  const [delta, setDelta] = useState<{
    stability: number;
    risk: number;
    budget_units: number;
  } | null>(null);
  const [milestone, setMilestone] = useState<GridOpsMilestone | null>(null);
  const [missionDrawerOpen, setMissionDrawerOpen] = useState(true);
  const [techDeckOpen, setTechDeckOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('2d');
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [activeDispatchCall, setActiveDispatchCall] = useState<GridOpsDispatchCallView | null>(null);
  const [pendingRepairId, setPendingRepairId] = useState<string | null>(null);
  const [pendingDispatchId, setPendingDispatchId] = useState<string | null>(null);
  const [darkRegionToast, setDarkRegionToast] = useState<string | null>(null);
  const prevRegionStatusesRef = useRef<Record<string, GridOpsRegionStatus>>({});
  const hasTrackedOpenRef = useRef(false);
  const user = useAuthStore((store) => store.user);
  const syncProgress = useProgressStore((store) => store.syncProgress);
  const setActiveIncidentCount = useGridOpsStore((s) => s.setActiveIncidentCount);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/grid-ops/state?scenario=${scenarioId}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Failed to load grid operations state.');
      }

      const payload = (await response.json()) as StateResponse;
      setState(payload.data);

      // Detect regions that newly went dark and show toast
      for (const region of payload.data.map.regions) {
        const prev = prevRegionStatusesRef.current[region.id];
        if (prev !== undefined && prev !== 'dark' && region.status === 'dark') {
          setDarkRegionToast(region.name);
        }
      }
      prevRegionStatusesRef.current = Object.fromEntries(
        payload.data.map.regions.map((r) => [r.id, r.status] as [string, GridOpsRegionStatus])
      );

      const incidentCount = payload.data.incidents?.length ?? 0;
      setActiveIncidentCount(incidentCount);
      if (incidentCount > 0) {
        setIncidentModalOpen(true);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load state.');
    } finally {
      setLoading(false);
    }
  }, [scenarioId, setActiveIncidentCount]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  useEffect(() => {
    setWebglSupported(detectWebGLSupport());
  }, []);

  useEffect(() => {
    if (!state || hasTrackedOpenRef.current) {
      return;
    }

    hasTrackedOpenRef.current = true;
    void trackProductEvent('grid_ops_opened', {
      availableKwh: state.resources.available_kwh,
      stabilityPct: state.simulation.stability_pct,
      recommendedAssetId: state.recommendation.next_best_action.target_asset_id
    });
  }, [state]);

  const handleDeploy = useCallback(
    async (assetId: string) => {
      if (!state || pendingAssetId) {
        return;
      }

      setPendingAssetId(assetId);
      setError(null);

      try {
        const response = await fetch('/api/grid-ops/action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': createGridOpsDeployRequestKey({
              scenarioId: scenarioId,
              turnIndex: state.simulation.turn_index,
              assetId
            })
          },
          body: JSON.stringify({
            scenarioId: scenarioId,
            actionType: 'deploy',
            assetId
          })
        });

        const payload = (await response.json()) as ActionResponse;
        if (!response.ok || !payload.data) {
          throw new Error(payload?.error ?? 'Failed to deploy asset.');
        }

        setState(payload.data.after_state);
        setDelta(payload.data.delta);
        setDeployingAssetId(assetId);

        const deployedAsset =
          payload.data.after_state.assets.find((asset) => asset.id === assetId) ?? null;
        const isFirstGridDeploy = payload.data.before_state.map.nodes.length === 1;

        void trackProductEvent('grid_asset_deployed', {
          assetId,
          assetName: deployedAsset?.name ?? assetId,
          unlocks: deployedAsset?.unlocks ?? null,
          stabilityAfter: payload.data.after_state.simulation.stability_pct,
          riskAfter: payload.data.after_state.simulation.blackout_risk_pct
        });

        if (isFirstGridDeploy) {
          void trackProductEventOnce('first_grid_deploy', 'first_grid_deploy', {
            assetId,
            assetName: deployedAsset?.name ?? assetId
          });
        }

        if (user?.id) {
          void syncProgress(user.id);
        }

        if (payload.data.milestone_unlocked) {
          setMilestone(payload.data.milestone_unlocked);
          window.setTimeout(() => {
            setMilestone(null);
          }, GRID_SCENE_ANIMATION_CONFIG.milestoneToastMs);
        }

        window.setTimeout(() => {
          setDelta(null);
        }, GRID_SCENE_ANIMATION_CONFIG.deltaClearMs);

        window.setTimeout(() => {
          setDeployingAssetId(null);
        }, GRID_SCENE_ANIMATION_CONFIG.deployPulseMs);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to deploy asset.');
      } finally {
        setPendingAssetId(null);
      }
    },
    [scenarioId, pendingAssetId, state, syncProgress, user?.id]
  );

  const handleRepair = useCallback(
    async (incidentId: string) => {
      if (pendingRepairId) return;
      setPendingRepairId(incidentId);
      setError(null);

      try {
        const response = await fetch('/api/grid-ops/incident/repair', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ incidentId, scenarioId: scenarioId })
        });

        const payload = await response.json();
        if (!response.ok || !payload.data) {
          throw new Error(payload?.error ?? 'Failed to repair incident.');
        }

        setState(payload.data.updated_state);

        // Update region status tracking after repair
        for (const region of payload.data.updated_state.map.regions) {
          const prev = prevRegionStatusesRef.current[region.id];
          if (prev !== undefined && prev !== 'dark' && region.status === 'dark') {
            setDarkRegionToast(region.name);
          }
        }
        prevRegionStatusesRef.current = Object.fromEntries(
          (payload.data.updated_state.map.regions as GridOpsRegionView[]).map((r) => [r.id, r.status] as [string, GridOpsRegionStatus])
        );

        const remaining = payload.data.updated_state.incidents?.length ?? 0;
        setActiveIncidentCount(remaining);
        if (remaining === 0) {
          setIncidentModalOpen(false);
        }

        if (user?.id) {
          void syncProgress(user.id);
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Failed to repair incident.');
      } finally {
        setPendingRepairId(null);
      }
    },
    [scenarioId, pendingRepairId, setActiveIncidentCount, syncProgress, user?.id]
  );

  const handleCompleteDispatchCall = useCallback(
    async (callId: string) => {
      if (pendingDispatchId) return;
      setPendingDispatchId(callId);
      setError(null);

      try {
        const response = await fetch('/api/grid-ops/dispatch/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId, scenarioId: scenarioId })
        });

        const payload = await response.json();
        if (!response.ok || !payload.data) {
          throw new Error(payload?.error ?? 'Failed to complete dispatch call.');
        }

        setState(payload.data.updated_state);

        // Reflect completed state inside the open modal
        setActiveDispatchCall((prev) =>
          prev?.id === callId ? { ...prev, completed: true } : prev
        );

        if (user?.id) {
          void syncProgress(user.id);
        }
      } catch (requestError) {
        setError(
          requestError instanceof Error ? requestError.message : 'Failed to complete dispatch call.'
        );
      } finally {
        setPendingDispatchId(null);
      }
    },
    [scenarioId, pendingDispatchId, syncProgress, user?.id]
  );

  const sortedAssets = useMemo(
    () => (state ? [...state.assets].sort((left, right) => left.cost_units - right.cost_units) : []),
    [state]
  );

  const recommendedAssetId = state?.recommendation.next_best_action.target_asset_id ?? null;
  const sceneRuntimeEnabled = !GRID_SCENE_DISABLE && webglSupported;
  const sceneDisabledMessage = GRID_SCENE_DISABLE
    ? 'Grid scene is disabled by ops flag (`NEXT_PUBLIC_GRID_SCENE_DISABLE=true`).'
    : 'WebGL is unavailable in this runtime. Scene rendering is disabled, but deployment controls remain available.';

  const handleAssetSelect = useCallback((assetId: string | null) => {
    setSelectedAssetId((previous) => {
      if (assetId === null) {
        return null;
      }

      return previous === assetId ? null : assetId;
    });
  }, []);

  useEffect(() => {
    if (!techDeckOpen) {
      setHighlightedAssetId(null);
    }
  }, [techDeckOpen]);

  useEffect(() => {
    if (!state || !selectedAssetId) {
      return;
    }

    const selectedAssetStillExists = state.assets.some((asset) => asset.id === selectedAssetId);
    if (!selectedAssetStillExists) {
      setSelectedAssetId(null);
    }
  }, [selectedAssetId, state]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent px-4 pb-12 pt-8 text-[#e6ebf2] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(144,216,196,0.12),transparent_26%),radial-gradient(circle_at_86%_10%,rgba(126,170,255,0.1),transparent_24%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--app-grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--app-grid-line) 1px, transparent 1px), linear-gradient(to right, var(--app-grid-line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--app-grid-line-strong) 1px, transparent 1px)',
          backgroundSize: '54px 54px, 54px 54px, 216px 216px, 216px 216px',
          backgroundPosition: '-1px -1px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.86), rgba(0,0,0,0.32))'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,transparent_50%,rgba(0,0,0,0.52)_100%)]" />

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-col gap-4">
        {/* Nav: back · mission identity · live stats · mission reopen */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/energy')}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.75rem] font-medium text-[#7a9ab8] transition hover:border-white/20 hover:text-[#a8c0d8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Missions
          </button>

          {scenarioDef && (
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-xl leading-none">{scenarioDef.flag}</span>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#3a5068]">
                  Mission {scenarioDef.order}
                </p>
                <p className="truncate text-[0.85rem] font-semibold text-[#c4d4e8]">
                  {scenarioDef.name}
                  <span className="ml-1.5 font-normal text-[#4a6278]">— {scenarioDef.subtitle}</span>
                </p>
              </div>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {state && (
              <>
                <span className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[0.72rem] font-semibold text-[#90c4a8] sm:inline-flex">
                  {state.simulation.stability_pct}% stable
                </span>
                <span className="hidden items-center rounded-full border border-amber-500/20 bg-amber-500/8 px-2.5 py-1 text-[0.7rem] font-medium text-amber-300/80 lg:inline-flex">
                  {state.events.active_event.label}
                </span>
              </>
            )}
            {state && !missionDrawerOpen && (
              <button
                type="button"
                onClick={() => setMissionDrawerOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[0.75rem] font-semibold text-[#dde8f6] transition hover:border-white/20 hover:bg-white/[0.075]"
              >
                Mission
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {loading && !state ? (
          <section className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] p-8 text-center shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-500" />
            <p className="mt-2 text-sm text-[#9dafc5]">Loading simulation board...</p>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-[24px] border border-rose-500/30 bg-[linear-gradient(180deg,rgba(66,20,26,0.58),rgba(22,10,13,0.9))] px-4 py-3 shadow-[0_24px_80px_-54px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <p className="text-sm font-medium text-rose-100">{error}</p>
            <button
              type="button"
              onClick={() => void fetchState()}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/20 px-3 py-1.5 text-sm font-medium text-rose-100 transition hover:border-rose-300/40 hover:bg-rose-500/12"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </section>
        ) : null}

        {state ? (
          <section>
            <div
              className={`grid items-start gap-3 ${
                missionDrawerOpen
                  ? 'xl:grid-cols-[minmax(0,1fr)_300px]'
                  : 'xl:grid-cols-1'
              }`}
            >
              <div className="space-y-3">
                {/* View mode toggle — Apple segmented pill */}
                <div className="inline-flex overflow-hidden rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('2d')}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all ${
                      viewMode === '2d'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('3d')}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition-all ${
                      viewMode === '3d'
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    3D
                  </button>
                </div>

                {viewMode === '2d' ? (
                  <VoltageZoneMap
                    state={state}
                    highlightedAssetId={highlightedAssetId}
                    deployingAssetId={deployingAssetId}
                  />
                ) : sceneRuntimeEnabled ? (
                  <GridSceneErrorBoundary>
                    <GridSceneCanvas
                      state={state}
                      highlightedAssetId={highlightedAssetId}
                      selectedAssetId={selectedAssetId}
                      deployingAssetId={deployingAssetId}
                      onAssetSelect={handleAssetSelect}
                    />
                  </GridSceneErrorBoundary>
                ) : (
                  <section className="flex h-[58vh] min-h-[520px] w-full items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] px-6 text-center shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95)] backdrop-blur-xl">
                    <p className="text-sm text-[#c8d3e3]">
                      {sceneDisabledMessage}
                    </p>
                  </section>
                )}

                <TechDeckDock
                  assets={sortedAssets}
                  recommendedAssetId={recommendedAssetId}
                  pendingAssetId={pendingAssetId}
                  open={techDeckOpen}
                  showModelPreviews={webglSupported}
                  onToggle={() => setTechDeckOpen((previous) => !previous)}
                  onDeploy={handleDeploy}
                  onAssetHover={setHighlightedAssetId}
                  selectedAssetId={selectedAssetId}
                  onAssetSelect={handleAssetSelect}
                />
              </div>

              {missionDrawerOpen ? (
                <MissionControlDrawer
                  state={state}
                  onHide={() => setMissionDrawerOpen(false)}
                  onOpenDispatchCall={setActiveDispatchCall}
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <MilestoneToast milestone={milestone} />

      <IncidentAlertModal
        incidents={state?.incidents ?? []}
        open={incidentModalOpen}
        onRepair={handleRepair}
        onDismiss={() => setIncidentModalOpen(false)}
        pendingRepairId={pendingRepairId}
      />

      <DispatchCallModal
        call={activeDispatchCall}
        onClose={() => setActiveDispatchCall(null)}
        onComplete={handleCompleteDispatchCall}
        pendingComplete={Boolean(pendingDispatchId)}
      />

      <DispatcherPanel />

      {darkRegionToast && (
        <RegionDarkToast
          regionName={darkRegionToast}
          onDismiss={() => setDarkRegionToast(null)}
        />
      )}
    </main>
  );
}
