'use client';

import Link from 'next/link';
import { ArrowUpRight, BookOpen, ClipboardCheck, Zap } from 'lucide-react';
import { forwardRef } from 'react';
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
    stat: string;
    primary: string;
    secondary: string;
    icon: typeof BookOpen;
  }
> = {
  theory: {
    panel: 'border-warning-500/24 bg-[#14110b]/92 shadow-[0_24px_56px_-44px_rgba(245,158,11,0.4)]',
    label: 'text-warning-300',
    stat: 'text-warning-100',
    primary:
      'border-warning-500/40 bg-warning-500/90 text-[#1a1206] hover:bg-warning-400',
    secondary:
      'border-warning-500/28 bg-warning-500/10 text-warning-100 hover:bg-warning-500/18',
    icon: BookOpen
  },
  tasks: {
    panel: 'border-brand-500/28 bg-[#0c1410]/92 shadow-[0_24px_56px_-44px_rgba(34,185,153,0.42)]',
    label: 'text-brand-300',
    stat: 'text-brand-100',
    primary: 'border-brand-500/42 bg-brand-500/90 text-[#04120f] hover:bg-brand-400',
    secondary:
      'border-brand-500/30 bg-brand-500/12 text-brand-100 hover:bg-brand-500/20',
    icon: ClipboardCheck
  },
  grid: {
    panel: 'border-slate-400/28 bg-[#0f1318]/92 shadow-[0_24px_56px_-44px_rgba(148,163,184,0.34)]',
    label: 'text-slate-300',
    stat: 'text-slate-100',
    primary: 'border-slate-400/40 bg-slate-200/90 text-slate-950 hover:bg-slate-100',
    secondary:
      'border-slate-400/35 bg-slate-500/10 text-slate-100 hover:bg-slate-500/18',
    icon: Zap
  }
};

export const ActivationCategoryCard = forwardRef<HTMLAnchorElement, ActivationCategoryCardProps>(
  ({ data }, ref) => {
    const tone = toneClassesByKind[data.kind];
    const Icon = tone.icon;

    return (
      <article
        data-testid={`activation-category-${data.kind}`}
        className={`flex h-full flex-col rounded-[1.35rem] border p-4 ${tone.panel}`}
      >
        <div className={`inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.label}`}>
          <Icon className="h-3.5 w-3.5" />
          {data.label}
        </div>

        <h2 className="mt-3 text-xl font-semibold text-text-dark-primary">{data.title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-dark-secondary">{data.summary}</p>
        {data.statLine ? <p className={`mt-2 text-sm ${tone.stat}`}>{data.statLine}</p> : null}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            ref={ref}
            href={data.primaryAction.href}
            data-testid={data.kind === 'theory' ? 'activation-primary-cta' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${tone.primary}`}
          >
            {data.primaryAction.label}
            <ArrowUpRight className="h-4 w-4" />
          </Link>

          {data.secondaryAction ? (
            <Link
              href={data.secondaryAction.href}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${tone.secondary}`}
            >
              {data.secondaryAction.label}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </article>
    );
  }
);

ActivationCategoryCard.displayName = 'ActivationCategoryCard';
