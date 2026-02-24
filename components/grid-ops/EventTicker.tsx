import { Clock3, Cloud, Flame, Wind } from 'lucide-react';
import type { ComponentType } from 'react';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface EventTickerProps {
  state: GridOpsComputedState;
}

const iconByEventId: Record<string, ComponentType<{ className?: string }>> = {
  cloud_cover_surge: Cloud,
  evening_peak: Flame,
  wind_ramp: Wind
};

export function EventTicker({ state }: EventTickerProps) {
  const active = state.events.active_event;
  const next = state.events.next_event;
  const EventIcon = iconByEventId[active.id] ?? Clock3;

  return (
    <section className="rounded-xl border border-[#d3e5db] bg-[#f5fbf8] p-3 dark:border-[#243f33] dark:bg-[#0f1914]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#567363] dark:text-[#86a695]">
            Active Grid Pressure
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-base font-semibold text-[#183128] dark:text-[#e2f3e8]">
            <EventIcon className="h-4 w-4 text-amber-500" />
            {active.label}
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
              {active.remaining_turns} turns left
            </span>
          </p>
          <p className="mt-1 text-sm text-[#456655] dark:text-[#9cbca9]">{active.briefing}</p>
        </div>

        <div className="rounded-lg border border-[#bdd5c8] bg-white px-3 py-2 text-sm dark:border-[#2d4a3b] dark:bg-[#111d17]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5c7968] dark:text-[#88a795]">
            Next threat
          </p>
          <p className="mt-1 font-semibold text-[#1b342a] dark:text-[#d8eee0]">{next.label}</p>
        </div>
      </div>
    </section>
  );
}
