import Link from 'next/link';
import { AlertTriangle, ArrowRight, MoreHorizontal, RefreshCcw } from 'lucide-react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface MissionControlDrawerProps {
  state: GridOpsComputedState;
  onHide: () => void;
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

export function MissionControlDrawer({ state, onHide }: MissionControlDrawerProps) {
  const active = state.events.active_event;
  const next = state.events.next_event;
  const recommendation = state.recommendation.next_best_action;
  const turnsLabel = active.remaining_turns === 1 ? 'turn' : 'turns';

  const targetAsset = recommendation.target_asset_id
    ? state.assets.find((asset) => asset.id === recommendation.target_asset_id) ?? null
    : null;

  const neededKwh = Math.max(0, unitsToKwh(recommendation.missing_units));
  const nextMilestone = state.milestones.next;

  const eventBriefing = oneLine(active.briefing)
    .replace(/\.$/, '')
    .replace(/^\w/, (char) => char.toUpperCase());

  const recommendedAction = targetAsset
    ? `Deploy ${targetAsset.name}`
    : recommendation.action;

  return (
    <aside className="relative h-fit overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] p-2.5 text-[#dbe4f1] shadow-[0_24px_80px_-48px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(144,216,196,0.12),transparent_28%)]" />

      <div className="relative mb-2 flex justify-end">
        <button
          type="button"
          onClick={onHide}
          className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/[0.045] px-3 py-1.5 text-[0.75rem] font-semibold text-[#dde8f6] transition hover:border-white/20 hover:bg-white/[0.075]"
        >
          <RefreshCcw className="h-3 w-3" />
          Hide Mission
          <MoreHorizontal className="h-3 w-3 text-[#9caec8]" />
        </button>
      </div>

      <section className="relative rounded-[20px] border border-white/8 bg-black/20 px-3 py-3 backdrop-blur-sm">
        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a7c2]">
          <AlertTriangle className="h-3 w-3 text-amber-300" />
          Active Event
        </p>

        <div className="mt-1 flex items-center gap-2">
          <p className="text-[1.02rem] font-semibold text-amber-200">{active.label}</p>
          <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[0.72rem] font-semibold text-amber-200">
            {active.remaining_turns} {turnsLabel}
          </span>
        </div>

        <p className="mt-1 text-[0.82rem] text-[#cad3e2]">{eventBriefing}</p>
        <p className="mt-1 text-[0.8rem] text-[#a8b8cf]">Next: {next.label}</p>
      </section>

      <div className="my-3 border-t border-white/10" />

      <section className="relative rounded-[20px] border border-white/8 bg-black/20 px-3 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a7c2]">Mission</p>

        <p className="mt-1 text-[1.05rem] font-semibold text-[#ecf1fb]">
          Stability {state.simulation.stability_pct}% -&gt; 100%
        </p>

        <div className="mt-2">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#95a8c2]">Recommended</p>
          <p className="mt-0.5 text-[0.92rem] font-semibold text-brand-300">{recommendedAction}</p>
          {targetAsset ? (
            <p className="mt-0.5 text-[0.8rem] text-[#c2cede]">Need +{neededKwh.toFixed(2)} kWh</p>
          ) : null}
        </div>

        <div className="mt-2">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#95a8c2]">Progress</p>
          <p className="mt-0.5 text-[0.82rem] text-[#c2cede]">
            {nextMilestone ? `Next milestone at ${nextMilestone.threshold}%` : 'All milestones completed'}
          </p>
        </div>

        <Link
          href="/learn/pyspark/theory/all"
          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-[18px] border border-white/12 bg-white/[0.05] px-3 py-2 text-[0.84rem] font-medium text-[#e6edf8] transition hover:border-white/20 hover:bg-white/[0.075]"
        >
          Continue Learning
          <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    </aside>
  );
}
