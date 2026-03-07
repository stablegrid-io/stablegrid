import { AlertTriangle, Activity, BatteryCharging, Gauge, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface GridStatusBarProps {
  state: GridOpsComputedState;
  delta?: {
    stability: number;
    risk: number;
    budget_units: number;
  } | null;
}

const formatSigned = (value: number, suffix: string) => {
  if (value === 0) {
    return `0${suffix}`;
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
};

const formatSignedKwh = (units: number) => {
  const kwh = unitsToKwh(units);
  if (kwh === 0) {
    return '0 kWh';
  }

  const sign = kwh > 0 ? '+' : '';
  return `${sign}${kwh.toFixed(2)} kWh`;
};

const StatCard = ({
  label,
  value,
  icon,
  deltaText,
  deltaTone = 'neutral'
}: {
  label: string;
  value: string;
  icon: ReactNode;
  deltaText?: string;
  deltaTone?: 'positive' | 'negative' | 'neutral';
}) => {
  const deltaColor =
    deltaTone === 'positive'
      ? 'text-brand-600 dark:text-brand-300'
      : deltaTone === 'negative'
        ? 'text-rose-600 dark:text-rose-300'
        : 'text-[#516b5c] dark:text-[#8ba897]';

  return (
    <div className="rounded-xl border border-[#d4e5dc] bg-[#f6fbf8] px-3 py-2.5 dark:border-[#234134] dark:bg-[#101a15]">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#557161] dark:text-[#89a996]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-black text-[#13261d] dark:text-[#e7f3eb]">{value}</p>
      {deltaText ? <p className={`mt-0.5 text-xs font-medium ${deltaColor}`}>{deltaText}</p> : null}
    </div>
  );
};

export function GridStatusBar({ state, delta }: GridStatusBarProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        label="Available kWh"
        value={`${state.resources.available_kwh.toFixed(2)} kWh`}
        icon={<BatteryCharging className="h-3.5 w-3.5" />}
        deltaText={delta ? formatSignedKwh(delta.budget_units) : undefined}
        deltaTone={delta && delta.budget_units < 0 ? 'negative' : 'neutral'}
      />
      <StatCard
        label="Stability"
        value={`${state.simulation.stability_pct}%`}
        icon={<TrendingUp className="h-3.5 w-3.5" />}
        deltaText={delta ? formatSigned(delta.stability, '%') : undefined}
        deltaTone={delta && delta.stability > 0 ? 'positive' : 'neutral'}
      />
      <StatCard
        label="Blackout Risk"
        value={`${state.simulation.blackout_risk_pct}%`}
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        deltaText={delta ? formatSigned(delta.risk, '%') : undefined}
        deltaTone={delta && delta.risk < 0 ? 'positive' : delta && delta.risk > 0 ? 'negative' : 'neutral'}
      />
      <StatCard
        label="Forecast Confidence"
        value={`${state.simulation.forecast_confidence_pct}%`}
        icon={<Gauge className="h-3.5 w-3.5" />}
      />
      <StatCard
        label="Operation Turn"
        value={`${state.simulation.turn_index}`}
        icon={<Activity className="h-3.5 w-3.5" />}
      />
    </section>
  );
}
