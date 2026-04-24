'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Activity } from 'lucide-react';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';
import WindTurbine from '@/components/home/WindTurbine';

const HERO_SNIPPET = `-- Chapter excerpt: Evening Peak Dispatch
WITH hourly_load AS (
  SELECT
    date_trunc('hour', ts) AS hour,
    SUM(ev_kw) AS ev_demand_kw,
    SUM(solar_kw) AS solar_kw
  FROM grid_events
  GROUP BY 1
), dispatch AS (
  SELECT
    hour,
    ev_demand_kw,
    solar_kw,
    GREATEST(ev_demand_kw - solar_kw, 0) AS battery_discharge_kw
  FROM hourly_load
)
SELECT * FROM dispatch
WHERE hour BETWEEN '18:00' AND '19:00';`;

const PROOF_POINTS = [
  {
    value: '20',
    label: 'live PySpark chapters'
  },
  {
    value: '4',
    label: 'study session modes'
  },
  {
    value: '2',
    label: 'current theory topics'
  }
] as const;

const FIRST_SESSION_STEPS = [
  'Open the PySpark route and finish the first chapter.',
  'Resume from the last read lesson after refresh or re-login.',
  'Complete the module checkpoint and unlock the next chapter.'
] as const;

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(34,185,153,0.19), transparent 40%), radial-gradient(circle at 84% 18%, rgba(100,160,220,0.12), transparent 36%)'
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(34,185,153,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(34,185,153,0.32) 1px, transparent 1px)',
          backgroundSize: '46px 46px'
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-grid-glow/30 bg-grid-glow/10 px-3 py-1.5 text-xs font-semibold text-grid-glow-bright">
            <Activity className="h-3 w-3" />
            Theory path for data engineers.
          </div>

          <h1
            className="mb-6 text-5xl font-bold leading-[1.04] tracking-tight text-[#e3efe8] lg:text-6xl"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Learn PySpark by
            <br />
            keeping
            <br />
            <span className="text-grid-glow">a live power grid stable.</span>
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-grid-text">
            stableGrid currently focuses on one structured PySpark-first route,
            chapter progression, and session controls. Practice, flashcards, and mission
            layers are in active build and not part of this launch.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              onClick={() => {
                void trackProductEvent('landing_cta', {
                  source: 'hero_primary'
                });
              }}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-grid-glow px-6 py-3 font-medium text-grid-ink transition-colors hover:bg-grid-glow-bright"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#grid-flow"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2b4f3a] px-6 py-3 font-medium text-grid-text transition-colors hover:border-grid-glow hover:text-[#e3efe8]"
            >
              Explore 330kV grid flow
            </a>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {PROOF_POINTS.map((point) => (
              <div
                key={point.label}
                className="rounded-2xl border border-grid-border bg-grid-panel/85 px-4 py-3"
              >
                <p className="text-2xl font-semibold text-[#e3efe8]">{point.value}</p>
                <p className="mt-1 font-mono font-bold text-xs uppercase tracking-[0.16em] text-grid-text-dim">
                  {point.label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-grid-text-dim">
            Free tier available. No card needed to inspect the core route.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center"
        >
          <WindTurbine size="main" background="transparent" />
        </motion.div>
      </div>
    </section>
  );
};
