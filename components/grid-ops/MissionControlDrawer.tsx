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
    <aside className="h-fit rounded-2xl border border-[#224035] bg-[radial-gradient(circle_at_74%_0%,rgba(16,185,129,0.12),transparent_48%),linear-gradient(180deg,rgba(7,17,14,0.97),rgba(5,12,10,0.96))] p-2 text-[#d3e9dc] shadow-[0_18px_48px_rgba(0,0,0,0.34)]">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onHide}
          className="inline-flex items-center gap-1 rounded-xl border border-[#345f50] bg-[#0c1b16]/88 px-2.5 py-1 text-[0.75rem] font-semibold text-[#d2ece0] transition hover:border-emerald-400/60"
        >
          <RefreshCcw className="h-3 w-3" />
          Hide Mission
          <MoreHorizontal className="h-3 w-3 text-[#90baa8]" />
        </button>
      </div>

      <section className="rounded-xl bg-[#0a1713]/82 px-2.5 py-2">
        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#84b9a3]">
          <AlertTriangle className="h-3 w-3 text-amber-300" />
          Active Event
        </p>

        <div className="mt-1 flex items-center gap-2">
          <p className="text-[1.02rem] font-semibold text-amber-200">{active.label}</p>
          <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[0.72rem] font-semibold text-amber-200">
            {active.remaining_turns} {turnsLabel}
          </span>
        </div>

        <p className="mt-1 text-[0.82rem] text-[#c6d8ce]">{eventBriefing}</p>
        <p className="mt-1 text-[0.8rem] text-[#9ec6b3]">Next: {next.label}</p>
      </section>

      <div className="my-2 border-t border-[#234438]" />

      <section className="rounded-xl bg-[#0a1713]/82 px-2.5 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#84b9a3]">Mission</p>

        <p className="mt-1 text-[1.05rem] font-semibold text-[#eaf7f0]">
          Stability {state.simulation.stability_pct}% -&gt; 100%
        </p>

        <div className="mt-2">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#8dbba7]">Recommended</p>
          <p className="mt-0.5 text-[0.92rem] font-semibold text-emerald-300">{recommendedAction}</p>
          {targetAsset ? (
            <p className="mt-0.5 text-[0.8rem] text-[#bfd5ca]">Need +{neededKwh.toFixed(2)} kWh</p>
          ) : null}
        </div>

        <div className="mt-2">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#8dbba7]">Progress</p>
          <p className="mt-0.5 text-[0.82rem] text-[#bfd5ca]">
            {nextMilestone ? `Next milestone at ${nextMilestone.threshold}%` : 'All milestones completed'}
          </p>
        </div>

        <Link
          href="/learn/pyspark/theory/all"
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#2d5b49] bg-[#0c2119] px-2.5 py-1.5 text-[0.84rem] font-medium text-[#e4f4ea] transition hover:border-emerald-400/70"
        >
          Continue Learning
          <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    </aside>
  );
}
