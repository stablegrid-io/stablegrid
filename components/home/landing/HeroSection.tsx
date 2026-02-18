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
            'radial-gradient(circle at 18% 22%, rgba(100,160,220,0.22), transparent 40%), radial-gradient(circle at 84% 18%, rgba(240,160,50,0.16), transparent 36%)'
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(100,160,220,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(100,160,220,0.35) 1px, transparent 1px)',
          backgroundSize: '46px 46px'
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-14 px-6 py-24 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#64a0dc]/25 bg-[#64a0dc]/10 px-3 py-1.5 text-xs font-semibold text-[#9cc0db]">
            <Activity className="h-3 w-3" />
            87% renewable grid penetration. Stability is the bottleneck.
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.04] tracking-tight lg:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>
            Master data engineering
            <br />
            by balancing
            <br />
            <span className="text-[#64a0dc]">a live power grid.</span>
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#9ab8d4]">
            Earn kWh credits through SQL, Python, PySpark, and statistics. Deploy real infrastructure in a renewable grid simulation and watch stability climb from marginal to optimal.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#64a0dc] px-6 py-3 font-medium text-[#09111e] transition-colors hover:bg-[#8eb9de]"
            >
              Start Learning - Earn Your First kWh
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3a6080] px-6 py-3 font-medium text-[#9ab8d4] transition-colors hover:border-[#64a0dc] hover:text-[#d8eaf8]"
            >
              See the loop
            </a>
          </div>

          <p className="mt-6 text-xs text-[#6f93b2]">
            Free tier available. Pro from $29/mo. Team from $99/mo.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:block"
        >
          <div className="overflow-hidden rounded-xl border border-[#3a6080]/55 bg-[#0c182a] shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 border-b border-[#3a6080]/45 bg-[#0a1524] px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-[#f87171]" />
              <div className="h-3 w-3 rounded-full bg-[#f0a032]" />
              <div className="h-3 w-3 rounded-full bg-[#4ade80]" />
              <span className="ml-3 font-mono text-xs text-[#6f93b2]">
                Mission 002 - Evening Peak Cascade
              </span>
            </div>

            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-[#d8eaf8]">
              <code>{HERO_SNIPPET}</code>
            </pre>

            <div className="flex items-center gap-3 border-t border-[#3a6080]/45 px-4 py-3">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#173150]">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#64a0dc] to-[#4ade80]" />
              </div>
              <span className="font-mono text-xs text-[#6f93b2]">+1.4 kWh mission reward</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
