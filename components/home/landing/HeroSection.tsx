'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Activity } from 'lucide-react';

const HERO_SNIPPET = `-- Mission 002: Evening Peak Cascade
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

export const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 22%, rgba(74,222,128,0.19), transparent 40%), radial-gradient(circle at 84% 18%, rgba(100,160,220,0.12), transparent 36%)'
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(74,222,128,0.32) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.32) 1px, transparent 1px)',
          backgroundSize: '46px 46px'
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10 px-3 py-1.5 text-xs font-semibold text-[#9de3b5]">
            <Activity className="h-3 w-3" />
            Scenario-based training for infrastructure-grade data engineers.
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.04] tracking-tight text-[#e3efe8] lg:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
            Build data engineering judgment
            <br />
            inside
            <br />
            <span className="text-[#4ade80]">a live power grid.</span>
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#9ab8a9]">
            StableGrid pairs a flagship PySpark learning path with grid incident missions and a live stability map. Instead of practicing syntax in isolation, users learn debugging, streaming, and system tradeoffs inside renewable-energy operations.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#4ade80] px-6 py-3 font-medium text-[#08110b] transition-colors hover:bg-[#6fe89a]"
            >
              Start the flagship path
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2b4f3a] px-6 py-3 font-medium text-[#9ab8a9] transition-colors hover:border-[#4ade80] hover:text-[#e3efe8]"
            >
              See the loop
            </a>
          </div>

          <p className="mt-6 text-xs text-[#6f8f7d]">Free tier available. Start with PySpark and grid incident missions.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="overflow-hidden rounded-xl border border-[#2b4f3a]/60 bg-[#0d1410] shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 border-b border-[#2b4f3a]/50 bg-[#0a120d] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#f87171]" />
              <div className="h-3 w-3 rounded-full bg-[#f0a032]" />
              <div className="h-3 w-3 rounded-full bg-[#4ade80]" />
              <span className="ml-3 font-mono text-xs text-[#7fb99a]">
                Mission 002 - Evening Peak Cascade
              </span>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[#d5ecdf]">
              <code>{HERO_SNIPPET}</code>
            </pre>

            <div className="flex items-center gap-3 border-t border-[#2b4f3a]/50 px-4 py-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#173223]">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#4ade80] to-[#64a0dc]" />
              </div>
              <span className="font-mono text-xs text-[#7fb99a]">+1.4 kWh mission reward</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
