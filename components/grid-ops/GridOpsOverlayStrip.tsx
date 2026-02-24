import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Gauge,
  TrendingUp
} from 'lucide-react';
import type { ReactNode } from 'react';
import { unitsToKwh } from '@/lib/energy';
import type { GridOpsComputedState } from '@/lib/grid-ops/types';

interface GridOpsOverlayStripProps {
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

function StatChip({
  label,
  value,
  accent,
  deltaText,
  icon
}: {
  label: string;
  value: string;
  accent: 'emerald' | 'amber' | 'rose' | 'slate' | 'cyan';
  deltaText?: string;
  icon: ReactNode;
}) {
  const accentClass =
    accent === 'emerald'
      ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200'
      : accent === 'amber'
        ? 'border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-200'
        : accent === 'rose'
          ? 'border-rose-500/35 bg-rose-500/12 text-rose-800 dark:text-rose-200'
          : accent === 'cyan'
            ? 'border-cyan-500/35 bg-cyan-500/12 text-cyan-800 dark:text-cyan-200'
            : 'border-slate-400/35 bg-slate-500/10 text-slate-800 dark:text-slate-200';

  return (
    <div className={`min-w-[160px] rounded-xl border px-3 py-2 ${accentClass}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-lg font-black leading-none">{value}</p>
      {deltaText ? <p className="mt-1 text-[11px] font-semibold opacity-90">{deltaText}</p> : null}
    </div>
  );
}

export function GridOpsOverlayStrip({ state, delta }: GridOpsOverlayStripProps) {
  return (
    <section className="pointer-events-auto rounded-2xl border border-[#c8ddd1] bg-white/90 p-2.5 shadow-[0_14px_38px_rgba(0,0,0,0.15)] backdrop-blur dark:border-[#284437] dark:bg-[#0d1713]/92">
      <div className="flex gap-2 overflow-x-auto">
        <StatChip
          label="Available kWh"
          value={`${state.resources.available_kwh.toFixed(2)} kWh`}
          deltaText={delta ? formatSignedKwh(delta.budget_units) : undefined}
          icon={<BatteryCharging className="h-3.5 w-3.5" />}
          accent="emerald"
        />
        <StatChip
          label="Stability"
          value={`${state.simulation.stability_pct}%`}
          deltaText={delta ? formatSigned(delta.stability, '%') : undefined}
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          accent="cyan"
        />
        <StatChip
          label="Blackout Risk"
          value={`${state.simulation.blackout_risk_pct}%`}
          deltaText={delta ? formatSigned(delta.risk, '%') : undefined}
          icon={<AlertTriangle className="h-3.5 w-3.5" />}
          accent={state.simulation.blackout_risk_pct >= 60 ? 'rose' : 'amber'}
        />
        <StatChip
          label="Forecast"
          value={`${state.simulation.forecast_confidence_pct}%`}
          icon={<Gauge className="h-3.5 w-3.5" />}
          accent="slate"
        />
        <StatChip
          label="Turn"
          value={`${state.simulation.turn_index}`}
          icon={<Activity className="h-3.5 w-3.5" />}
          accent="slate"
        />
      </div>
    </section>
  );
}
