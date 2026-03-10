'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  Zap
} from 'lucide-react';
import { forwardRef, type CSSProperties } from 'react';
import type {
  ActivationCategoryCardData,
  ActivationCategoryKind
} from '@/components/home/activation-table/types';

interface ActivationCategoryCardProps {
  data: ActivationCategoryCardData;
}

const toneClassesByKind: Record<
  ActivationCategoryKind,
  {
    panel: string;
    label: string;
    labelPill: string;
    stat: string;
    progressTrack: string;
    progressFill: string;
    primary: string;
    topGlow: string;
    accentRail: string;
    icon: typeof BookOpen;
  }
> = {
  theory: {
    panel: 'border-warning-500/24 bg-[#14110b]/92 shadow-[0_24px_56px_-44px_rgba(245,158,11,0.4)]',
    label: 'text-warning-300',
    labelPill: 'border-warning-500/34 bg-warning-500/12',
    stat: 'text-warning-100',
    progressTrack: 'bg-warning-400/18',
    progressFill: 'bg-warning-400',
    primary:
      'border-warning-500/40 bg-warning-500/90 text-[#1a1206] hover:bg-warning-400',
    topGlow: 'from-warning-500/18 via-warning-500/6 to-transparent',
    accentRail: 'from-warning-400/75 via-warning-400/24 to-transparent',
    icon: BookOpen
  },
  tasks: {
    panel: 'border-brand-500/28 bg-[#0c1410]/92 shadow-[0_24px_56px_-44px_rgba(34,185,153,0.42)]',
    label: 'text-brand-300',
    labelPill: 'border-brand-500/38 bg-brand-500/12',
    stat: 'text-brand-100',
    progressTrack: 'bg-brand-400/18',
    progressFill: 'bg-brand-400',
    primary: 'border-brand-500/42 bg-brand-500/90 text-[#04120f] hover:bg-brand-400',
    topGlow: 'from-brand-500/18 via-brand-500/7 to-transparent',
    accentRail: 'from-brand-400/80 via-brand-400/24 to-transparent',
    icon: ClipboardCheck
  },
  grid: {
    panel: 'border-slate-400/28 bg-[#0f1318]/92 shadow-[0_24px_56px_-44px_rgba(148,163,184,0.34)]',
    label: 'text-slate-300',
    labelPill: 'border-slate-400/34 bg-slate-400/10',
    stat: 'text-slate-100',
    progressTrack: 'bg-slate-300/16',
    progressFill: 'bg-slate-300',
    primary: 'border-slate-400/40 bg-slate-200/90 text-slate-950 hover:bg-slate-100',
    topGlow: 'from-slate-300/16 via-slate-300/5 to-transparent',
    accentRail: 'from-slate-300/78 via-slate-300/24 to-transparent',
    icon: Zap
  }
};

const resolveTone = (
  kind: ActivationCategoryKind,
  accentRgb: string | undefined
) => {
  if (!accentRgb || kind === 'grid') {
    return toneClassesByKind[kind];
  }

  return {
    ...toneClassesByKind[kind],
    panel:
      'border-[rgba(var(--activation-accent),0.34)] bg-[#0b1016]/92 shadow-[0_24px_56px_-44px_rgba(var(--activation-accent),0.42)]',
    label: 'text-[rgb(var(--activation-accent))]',
    labelPill:
      'border-[rgba(var(--activation-accent),0.36)] bg-[rgba(var(--activation-accent),0.12)]',
    stat: 'text-[rgba(var(--activation-accent),0.92)]',
    progressTrack: 'bg-[rgba(var(--activation-accent),0.2)]',
    progressFill: 'bg-[rgba(var(--activation-accent),0.94)]',
    primary:
      'border-[rgba(var(--activation-accent),0.48)] bg-[rgba(var(--activation-accent),0.9)] text-[#04120f] hover:bg-[rgba(var(--activation-accent),0.78)]',
    topGlow:
      'from-[rgba(var(--activation-accent),0.2)] via-[rgba(var(--activation-accent),0.07)] to-transparent',
    accentRail:
      'from-[rgba(var(--activation-accent),0.84)] via-[rgba(var(--activation-accent),0.28)] to-transparent'
  };
};

export const ActivationCategoryCard = forwardRef<HTMLAnchorElement, ActivationCategoryCardProps>(
  ({ data }, ref) => {
    const tone = resolveTone(data.kind, data.accentRgb);
    const Icon = tone.icon;
    const progressValue = data.progress
      ? Math.max(0, Math.min(100, Math.round(data.progress.valuePct)))
      : null;
    const accentStyle = data.accentRgb
      ? ({ '--activation-accent': data.accentRgb } as CSSProperties)
      : undefined;

    return (
      <article
        data-testid={`activation-category-${data.kind}`}
        className={`relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border p-4 ${tone.panel}`}
        style={accentStyle}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${tone.topGlow}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-gradient-to-b ${tone.accentRail}`}
        />

        <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.label} ${tone.labelPill}`}>
          <Icon className="h-3.5 w-3.5" />
          {data.label}
        </div>

        <div className="mt-3 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-text-dark-primary">{data.title}</h2>
          {data.statLine ? <p className={`text-sm ${tone.stat}`}>{data.statLine}</p> : null}
          {progressValue !== null ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium uppercase tracking-[0.14em] text-text-dark-tertiary">
                  {data.progress?.label ?? 'Progress'}
                </span>
                <span className={tone.stat}>{data.progress?.valueLabel ?? `${progressValue}%`}</span>
              </div>
              <div className={`h-1.5 w-full overflow-hidden rounded-full ${tone.progressTrack}`}>
                <div
                  role="progressbar"
                  aria-label={`${data.label} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressValue}
                  data-testid={`activation-progress-${data.kind}`}
                  className={`h-full rounded-full transition-[width] duration-300 ${tone.progressFill}`}
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>
          ) : null}

          {data.primaryAction ? (
            <div className="flex items-center">
              <Link
                ref={ref}
                href={data.primaryAction.href}
                data-testid={data.kind === 'theory' ? 'activation-primary-cta' : undefined}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${tone.primary}`}
              >
                {data.primaryAction.label}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </article>
    );
  }
);

ActivationCategoryCard.displayName = 'ActivationCategoryCard';
