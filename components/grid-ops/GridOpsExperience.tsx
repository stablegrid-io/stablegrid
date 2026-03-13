'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import { GRID_SCENE_ANIMATION_CONFIG } from '@/lib/grid-ops/sceneAnimationConfig';
import type { GridOpsComputedState, GridOpsMilestone } from '@/lib/grid-ops/types';
import {
  trackProductEvent,
  trackProductEventOnce
} from '@/lib/analytics/productAnalytics';
import { GridOpsHeader } from '@/components/grid-ops/GridOpsHeader';
import { MilestoneToast } from '@/components/grid-ops/MilestoneToast';
import { MissionControlDrawer } from '@/components/grid-ops/MissionControlDrawer';
import { GridSceneErrorBoundary } from '@/components/grid-ops/scene/GridSceneErrorBoundary';
import { GridSceneCanvas } from '@/components/grid-ops/scene/GridSceneCanvas';
import { TechDeckDock } from '@/components/grid-ops/TechDeckDock';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
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

export function GridOpsExperience() {
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
  const hasTrackedOpenRef = useRef(false);
  const user = useAuthStore((store) => store.user);
  const syncProgress = useProgressStore((store) => store.syncProgress);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/grid-ops/state?scenario=${GRID_OPS_DEFAULT_SCENARIO}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'Failed to load grid operations state.');
      }

      const payload = (await response.json()) as StateResponse;
      setState(payload.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load state.');
    } finally {
      setLoading(false);
    }
  }, []);

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
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scenarioId: GRID_OPS_DEFAULT_SCENARIO,
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
    [pendingAssetId, state, syncProgress, user?.id]
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
    <main className="relative min-h-screen overflow-hidden bg-[#04070b] px-4 pb-12 pt-8 text-[#e6ebf2] sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(144,216,196,0.16),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(126,170,255,0.12),transparent_22%),linear-gradient(180deg,#09111a_0%,#05090f_40%,#03060a_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '42px 42px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.18))'
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,transparent_50%,rgba(0,0,0,0.52)_100%)]" />

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-col gap-4">
        <GridOpsHeader />

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
                {sceneRuntimeEnabled ? (
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
                />
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      <MilestoneToast milestone={milestone} />
    </main>
  );
}
