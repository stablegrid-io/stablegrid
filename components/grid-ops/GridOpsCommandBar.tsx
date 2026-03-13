import { AlertTriangle, Bolt, RefreshCcw, TrendingUp } from 'lucide-react';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface GridOpsCommandBarProps {
  state: GridOpsComputedState;
  missionOpen: boolean;
  onToggleMission: () => void;
}

export function GridOpsCommandBar({
  state,
  missionOpen,
  onToggleMission
}: GridOpsCommandBarProps) {
  const activeEvent = state.events.active_event;
  const recommendedAsset =
    state.assets.find(
      (asset) => asset.id === state.recommendation.next_best_action.target_asset_id
    ) ?? null;

  return (
    <section className="relative overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] px-3.5 py-3 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_42%),radial-gradient(circle_at_88%_0%,rgba(144,216,196,0.1),transparent_28%)]" />

      <div className="relative flex flex-wrap items-center gap-3 text-[#dce5f2]">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.13em] text-[#95a8c0]">
          Live Grid Stabilization Map
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-400/25 bg-brand-500/10 px-2 py-0.5 text-[#e8f5ef]">
            <Bolt className="h-3 w-3 text-brand-300" />
            <span className="font-semibold">{state.resources.available_kwh.toFixed(2)} kWh</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[#eaf7ff]">
            <TrendingUp className="h-3 w-3 text-cyan-300" />
            <span className="font-semibold">Stability {state.simulation.stability_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[#fff3da]">
            <AlertTriangle className="h-3 w-3 text-amber-300" />
            <span className="font-semibold">Risk {state.simulation.blackout_risk_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[#b9c7d9]">
            <span className="font-semibold">Forecast {state.simulation.forecast_confidence_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.045] px-2 py-0.5 text-[#d5dfec]">
            <AlertTriangle className="h-3 w-3 text-amber-300" />
            <span className="font-semibold">{activeEvent.label} ({activeEvent.remaining_turns}T)</span>
          </span>
        </div>
      </div>

      <div className="relative mt-3 grid gap-2 border-t border-white/10 pt-3 text-[0.78rem] text-[#bcc6d5] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <div className="rounded-[20px] border border-white/8 bg-black/20 px-3 py-2.5 backdrop-blur-sm">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#90a4bc]">
            Next move
          </p>
          <p className="mt-1 text-sm font-semibold text-[#e8eef9]">
            {recommendedAsset ? recommendedAsset.name : 'Continue earning kWh'}
          </p>
          <p className="mt-1 text-[#a8b6c8]">{state.recommendation.next_best_action.action}</p>
        </div>

        <div className="rounded-[20px] border border-white/8 bg-black/20 px-3 py-2.5 backdrop-blur-sm">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#90a4bc]">
            What this changes
          </p>
          <p className="mt-1 text-sm font-semibold text-[#e8eef9]">
            {recommendedAsset?.unlocks ?? 'Higher grid stability margins'}
          </p>
          <p className="mt-1 text-[#a8b6c8]">
            {recommendedAsset
              ? `Deploying this asset improves stability by ${recommendedAsset.effects.stability}% and deepens the simulation route.`
              : 'Continue the loop to expose the next infrastructure outcome.'}
          </p>
        </div>

        {!missionOpen ? (
          <button
            type="button"
            onClick={onToggleMission}
            className="inline-flex items-center justify-center gap-1 self-center rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[0.75rem] font-semibold text-[#dfe8f6] transition hover:border-white/20 hover:bg-white/[0.075]"
          >
            <RefreshCcw className="h-3 w-3" />
            Show Mission
          </button>
        ) : null}
      </div>
    </section>
  );
}
