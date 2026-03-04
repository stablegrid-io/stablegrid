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
    <section className="rounded-[18px] border border-[#1f3f34] bg-[linear-gradient(180deg,rgba(6,16,13,0.98),rgba(4,12,10,0.97))] px-3 py-2 shadow-[0_14px_38px_rgba(0,0,0,0.36)]">
      <div className="flex flex-wrap items-center gap-3 text-[#d5ede1]">
        <p className="text-[0.78rem] font-semibold uppercase tracking-[0.13em] text-[#88c4ad]">
          Live Grid Stabilization Map
        </p>

        <div className="flex flex-wrap items-center gap-2 text-[0.8rem]">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5">
            <Bolt className="h-3 w-3 text-emerald-300" />
            <span className="font-semibold">{state.resources.available_kwh.toFixed(2)} kWh</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5">
            <TrendingUp className="h-3 w-3 text-cyan-300" />
            <span className="font-semibold">Stability {state.simulation.stability_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3 text-amber-300" />
            <span className="font-semibold">Risk {state.simulation.blackout_risk_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#346050] bg-[#0d1e18]/85 px-2 py-0.5 text-[#9dbeaf]">
            <span className="font-semibold">Forecast {state.simulation.forecast_confidence_pct}%</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#39644f] bg-[#0f221a]/90 px-2 py-0.5 text-[#bbd8cc]">
            <AlertTriangle className="h-3 w-3 text-amber-300" />
            <span className="font-semibold">{activeEvent.label} ({activeEvent.remaining_turns}T)</span>
          </span>
        </div>

      </div>

      <div className="mt-2 grid gap-2 border-t border-[#214234] pt-2 text-[0.78rem] text-[#b9d5c8] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <div className="rounded-2xl border border-[#234636] bg-[#09120f] px-3 py-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#7fae97]">
            Next move
          </p>
          <p className="mt-1 text-sm font-semibold text-[#e0f0e7]">
            {recommendedAsset ? recommendedAsset.name : 'Continue earning kWh'}
          </p>
          <p className="mt-1 text-[#9fbcaf]">{state.recommendation.next_best_action.action}</p>
        </div>

        <div className="rounded-2xl border border-[#234636] bg-[#09120f] px-3 py-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-[#7fae97]">
            What this changes
          </p>
          <p className="mt-1 text-sm font-semibold text-[#e0f0e7]">
            {recommendedAsset?.unlocks ?? 'Higher grid stability margins'}
          </p>
          <p className="mt-1 text-[#9fbcaf]">
            {recommendedAsset
              ? `Deploying this asset improves stability by ${recommendedAsset.effects.stability}% and deepens the simulation route.`
              : 'Continue the loop to expose the next infrastructure outcome.'}
          </p>
        </div>

        {!missionOpen ? (
          <button
            type="button"
            onClick={onToggleMission}
            className="inline-flex items-center justify-center gap-1 self-center rounded-full border border-[#355f4f] bg-[#0d1d17] px-2.5 py-1 text-[0.75rem] font-semibold text-[#d2ece0] transition hover:border-emerald-400/60"
          >
            <RefreshCcw className="h-3 w-3" />
            Show Mission
          </button>
        ) : null}
      </div>
    </section>
  );
}
