'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { GRID_OPS_DEFAULT_SCENARIO } from '@/lib/grid-ops/config';
import { GRID_SCENE_ANIMATION_CONFIG } from '@/lib/grid-ops/sceneAnimationConfig';
import type { GridOpsComputedState, GridOpsMilestone } from '@/lib/grid-ops/types';
import { GridOpsCommandBar } from '@/components/grid-ops/GridOpsCommandBar';
import { GridOpsHeader } from '@/components/grid-ops/GridOpsHeader';
import { MilestoneToast } from '@/components/grid-ops/MilestoneToast';
import { MissionControlDrawer } from '@/components/grid-ops/MissionControlDrawer';
import { GridSceneErrorBoundary } from '@/components/grid-ops/scene/GridSceneErrorBoundary';
import { GridSceneCanvas } from '@/components/grid-ops/scene/GridSceneCanvas';
import { TechDeckDock } from '@/components/grid-ops/TechDeckDock';

interface StateResponse {
  data: GridOpsComputedState;
}

interface ActionResponse {
  data: {
    after_state: GridOpsComputedState;
    delta: {
      stability: number;
      risk: number;
      budget_units: number;
    };
    milestone_unlocked: GridOpsMilestone | null;
  };
  error?: string;
}

const GRID_SCENE_DISABLE = process.env.NEXT_PUBLIC_GRID_SCENE_DISABLE === 'true';

export function GridOpsExperience() {
  const [state, setState] = useState<GridOpsComputedState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    [pendingAssetId, state]
  );

  const sortedAssets = useMemo(
    () => (state ? [...state.assets].sort((left, right) => left.cost_units - right.cost_units) : []),
    [state]
  );

  const recommendedAssetId = state?.recommendation.next_best_action.target_asset_id ?? null;

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
    <main className="min-h-screen bg-light-bg px-4 pb-12 pt-8 text-text-light-primary dark:bg-[#060b09] dark:text-[#e5efe9] sm:px-6">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4">
        <GridOpsHeader />

        {loading && !state ? (
          <section className="rounded-xl border border-[#d3e5db] bg-[#f6fbf8] p-8 text-center dark:border-[#223c31] dark:bg-[#0f1914]">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
            <p className="mt-2 text-sm text-[#4f6b5b] dark:text-[#98b8a7]">Loading simulation board...</p>
          </section>
        ) : null}

        {error ? (
          <section className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3">
            <p className="text-sm font-medium text-rose-700 dark:text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void fetchState()}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-rose-500/40 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:bg-[#1b1313] dark:text-rose-200"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </section>
        ) : null}

        {state ? (
          <section className="space-y-3">
            <GridOpsCommandBar
              state={state}
              missionOpen={missionDrawerOpen}
              onToggleMission={() => setMissionDrawerOpen((previous) => !previous)}
            />

            <div
              className={`grid items-start gap-3 ${
                missionDrawerOpen
                  ? 'xl:grid-cols-[minmax(0,1fr)_300px]'
                  : 'xl:grid-cols-1'
              }`}
            >
              <div className="space-y-3">
                {!GRID_SCENE_DISABLE ? (
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
                  <section className="flex h-[58vh] min-h-[520px] w-full items-center justify-center rounded-2xl border border-amber-500/30 bg-[#0c1612] px-6 text-center">
                    <p className="text-sm text-[#cce1d7]">
                      Grid scene is disabled by ops flag (`NEXT_PUBLIC_GRID_SCENE_DISABLE=true`).
                    </p>
                  </section>
                )}

                <TechDeckDock
                  assets={sortedAssets}
                  recommendedAssetId={recommendedAssetId}
                  pendingAssetId={pendingAssetId}
                  open={techDeckOpen}
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
