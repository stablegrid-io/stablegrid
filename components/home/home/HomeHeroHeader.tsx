'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

interface HomeHeroHighlight {
  label: string;
  value: string;
}

interface HomeHeroHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryActionHref: string;
  primaryActionLabel: string;
  primaryMeta: string;
  highlights: HomeHeroHighlight[];
}

export const HomeHeroHeader = ({
  eyebrow,
  title,
  description,
  primaryActionHref,
  primaryActionLabel,
  primaryMeta,
  highlights
}: HomeHeroHeaderProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      data-testid="home-shift-briefing"
      className="relative overflow-hidden rounded-[2rem] border border-emerald-200/70 bg-[#f4f8f5] shadow-[0_24px_80px_-58px_rgba(15,23,42,0.32)] backdrop-blur dark:border-emerald-400/25 dark:bg-[linear-gradient(140deg,#0c1a14,#09120f)]"
    >
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.72), rgba(238,246,241,0.64)), radial-gradient(circle at 92% 8%, rgba(16,185,129,0.16), transparent 34%), linear-gradient(90deg, rgba(15,23,42,0.04) 1px, transparent 1px), linear-gradient(rgba(15,23,42,0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'radial-gradient(circle at 82% 18%, rgba(16,185,129,0.22), transparent 26%), linear-gradient(180deg, rgba(8,16,13,0.08), rgba(8,16,13,0.34)), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 32px 32px, 32px 32px'
        }}
      />

      <div className="relative z-10 grid gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,1.25fr)_320px] lg:items-start">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1
            className="mt-4 text-[2.1rem] font-semibold tracking-tight text-[#0f1d16] dark:text-[#f2fbf5] sm:text-[2.8rem]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#2f4c3d] dark:text-[#c8ddd1] sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-col items-start gap-3">
            <Link
              href={primaryActionHref}
              data-testid="home-primary-action"
              onClick={() => {
                void trackProductEvent('home_primary_action_clicked', {
                  href: primaryActionHref,
                  label: primaryActionLabel
                });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#072014] transition-colors hover:bg-emerald-400 dark:bg-emerald-400 dark:text-[#07100a] dark:hover:bg-emerald-300"
            >
              {primaryActionLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm font-medium text-[#3b5849] dark:text-[#a9c3b5]">
              {primaryMeta}
            </p>
            <p className="text-xs uppercase tracking-[0.16em] text-[#567364] dark:text-[#83a795]">
              The route map below explains why this is next.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.35rem] border border-emerald-200/70 bg-white/78 px-4 py-3 dark:border-emerald-400/20 dark:bg-[#0f2019]/72"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4c6a5a] dark:text-[#89b09d]">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-[#0f1d16] dark:text-[#eef9f2]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};
