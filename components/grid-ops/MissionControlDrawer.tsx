import Link from 'next/link';
import { AlertTriangle, ArrowRight, MapPin, Radio, X } from 'lucide-react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsComputedState, GridOpsDispatchCallView } from '@/lib/grid-ops/types';
import { RegionStatusPanel } from './RegionStatusPanel';

interface MissionControlDrawerProps {
  state: GridOpsComputedState;
  onHide: () => void;
  onOpenDispatchCall: (call: GridOpsDispatchCallView) => void;
}

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

export function MissionControlDrawer({ state, onHide, onOpenDispatchCall }: MissionControlDrawerProps) {
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
          aria-label="Close mission panel"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[#7a9ab8] transition hover:border-white/20 hover:bg-white/[0.08] hover:text-[#a8c0d8]"
        >
          <X className="h-3.5 w-3.5" />
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
        <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a7c2]">
          <MapPin className="h-3 w-3" />
          Regions
        </p>
        <RegionStatusPanel regions={state.map.regions} />
      </section>

      <div className="my-3 border-t border-white/10" />

      <section className="relative rounded-[20px] border border-white/8 bg-black/20 px-3 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a7c2]">Mission</p>
          <span className="text-[0.78rem] font-semibold tabular-nums text-[#90c4a8]">
            {state.simulation.stability_pct}%
          </span>
        </div>

        {/* Stability progress bar */}
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
            style={{ width: `${Math.min(state.simulation.stability_pct, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-[0.7rem] text-[#5a7090]">
          {nextMilestone
            ? `Next milestone at ${nextMilestone.threshold}%`
            : 'All milestones reached'}
        </p>

        <div className="mt-2.5">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-[#95a8c2]">Next move</p>
          <p className="mt-0.5 text-[0.92rem] font-semibold text-brand-300">{recommendedAction}</p>
          {targetAsset ? (
            <p className="mt-0.5 text-[0.8rem] text-[#c2cede]">Need +{neededKwh.toFixed(2)} kWh</p>
          ) : null}
        </div>

        <Link
          href="/learn"
          className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-[18px] border border-white/12 bg-white/[0.05] px-3 py-2 text-[0.84rem] font-medium text-[#e6edf8] transition hover:border-white/20 hover:bg-white/[0.075]"
        >
          Continue Learning
          <ArrowRight className="h-3 w-3" />
        </Link>
      </section>

      {state.dispatch_calls.length > 0 && (
        <>
          <div className="my-3 border-t border-white/10" />

          <section className="relative rounded-[20px] border border-white/8 bg-black/20 px-3 py-3 backdrop-blur-sm">
            <p className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#94a7c2]">
              <Radio className="h-3 w-3 text-brand-400" />
              Dispatch Calls
              <span className="ml-1 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-300">
                {state.dispatch_calls.filter((c) => !c.completed).length}
              </span>
            </p>

            <div className="mt-2 space-y-1.5">
              {state.dispatch_calls.map((call) => (
                <button
                  key={call.id}
                  type="button"
                  onClick={() => onOpenDispatchCall(call)}
                  className={`w-full rounded-[14px] border px-3 py-2 text-left transition ${
                    call.completed
                      ? 'border-white/6 bg-white/[0.025] opacity-60 cursor-default'
                      : 'border-brand-500/25 bg-brand-500/10 hover:border-brand-400/40 hover:bg-brand-500/[0.18]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-[0.8rem] font-semibold ${
                        call.completed ? 'text-[#7a8da5]' : 'text-brand-200'
                      }`}
                    >
                      {call.title}
                    </p>
                    {call.completed ? (
                      <span className="shrink-0 text-[0.7rem] font-bold text-[#22b999]">✓</span>
                    ) : (
                      <span className="shrink-0 text-[0.7rem] font-semibold text-brand-300">
                        +{unitsToKwh(call.reward_units).toFixed(2)} kWh
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[0.73rem] text-[#8fa4be]">{call.summary}</p>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </aside>
  );
}
