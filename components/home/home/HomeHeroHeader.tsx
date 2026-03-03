'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Layers3, Zap } from 'lucide-react';
import Link from 'next/link';

interface HomeHeroHeaderProps {
  firstName: string;
  nextLine: string;
  riskLine: string;
  rewardLine: string;
  primaryActionHref: string;
  primaryActionLabel: string;
  practiceHref: string;
  gridHref: string;
  simplified: boolean;
  onToggleSimplified: () => void;
}

export const HomeHeroHeader = ({
  firstName,
  nextLine,
  riskLine,
  rewardLine,
  primaryActionHref,
  primaryActionLabel,
  practiceHref,
  gridHref,
  simplified,
  onToggleSimplified
}: HomeHeroHeaderProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      data-testid="home-shift-briefing"
      className="relative overflow-hidden rounded-[2rem] border border-[#cfd8cf] bg-[rgba(249,246,240,0.86)] shadow-[0_24px_80px_-58px_rgba(15,23,42,0.32)] backdrop-blur dark:border-white/10 dark:bg-[rgba(10,18,14,0.78)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(247,243,236,0.55)), radial-gradient(circle at 100% 0%, rgba(16,185,129,0.12), transparent 30%), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 36px 36px, 36px 36px'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-70 dark:opacity-100"
        style={{
          background:
            'linear-gradient(135deg, rgba(245,158,11,0.08), transparent 28%), radial-gradient(circle at 82% 18%, rgba(16,185,129,0.15), transparent 24%)'
        }}
      />

      <div className="relative z-10 px-5 py-5 sm:px-6 sm:py-6">
        <div className="max-w-4xl">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7e5db] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#315847] dark:border-white/10 dark:bg-white/5 dark:text-[#8ed3af]">
              <Zap className="h-3.5 w-3.5" />
              Shift briefing
            </div>
            <h1
              className="mt-4 text-[2.25rem] font-semibold tracking-tight text-[#101918] dark:text-[#f3f7f4] sm:text-[3rem]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {firstName}, hold the grid steady.
            </h1>
          </div>
        </div>

        <div className="mt-5 grid gap-2 text-base leading-7 text-[#27312d] dark:text-[#d6e4dc]">
          <BriefingLine label="Next" value={nextLine} />
          <BriefingLine label="Risk" value={riskLine} />
          <BriefingLine label="Reward" value={rewardLine} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={primaryActionHref}
            data-testid="home-primary-action"
            className="inline-flex items-center gap-2 rounded-xl bg-[#101918] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a100e] dark:bg-emerald-400 dark:text-[#07100a] dark:hover:bg-emerald-300"
          >
            {primaryActionLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={practiceHref}
            data-testid="home-secondary-practice"
            className="inline-flex items-center gap-2 rounded-xl border border-[#c9d3cc] bg-white/78 px-4 py-3 text-sm font-medium text-[#1c2b24] transition-colors hover:border-emerald-500/35 hover:text-[#101918] dark:border-white/10 dark:bg-white/5 dark:text-[#d7e8de] dark:hover:border-emerald-300/35"
          >
            Practice
          </Link>
          <Link
            href={gridHref}
            data-testid="home-secondary-grid"
            className="inline-flex items-center gap-2 rounded-xl border border-[#c9d3cc] bg-white/78 px-4 py-3 text-sm font-medium text-[#1c2b24] transition-colors hover:border-emerald-500/35 hover:text-[#101918] dark:border-white/10 dark:bg-white/5 dark:text-[#d7e8de] dark:hover:border-emerald-300/35"
          >
            Open Grid
          </Link>
        </div>

        <button
          type="button"
          onClick={onToggleSimplified}
          data-testid="home-simplify-toggle"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#cfd8cf] bg-white/60 px-3 py-2 text-sm font-medium text-[#31453a] transition-colors hover:border-emerald-500/30 hover:text-[#152019] dark:border-white/10 dark:bg-white/5 dark:text-[#b9d0c3] dark:hover:border-emerald-300/30"
        >
          <Layers3 className="h-4 w-4" />
          {simplified ? 'Show full console' : 'Simplify view'}
        </button>
      </div>
    </motion.section>
  );
};

const BriefingLine = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2 text-sm sm:text-base">
    <span className="min-w-[64px] font-semibold text-[#101918] dark:text-[#f3f7f4]">
      {label}:
    </span>
    <span>{value}</span>
  </div>
);
