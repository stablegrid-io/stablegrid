'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

const FREE_FEATURES = [
  { text: 'Full SQL + basic Python curriculum', included: true },
  { text: 'Limited PySpark (first 3 chapters)', included: true },
  { text: '50 practice questions', included: true },
  { text: 'First 2 missions', included: true },
  { text: 'Deploy up to 5 infrastructure nodes', included: true },
  { text: 'Grid stability cap: 75%', included: true },
  { text: 'Advanced analytics and certificates', included: false },
  { text: 'All missions and full node set', included: false }
];

const PRO_FEATURES = [
  { text: 'Everything in Free' },
  { text: 'Full PySpark curriculum (20+ chapters)' },
  { text: 'All 290 practice questions' },
  { text: 'All missions and full infrastructure map' },
  { text: 'Advanced performance analytics + skill gaps' },
  { text: 'Priority execution sandbox' },
  { text: 'Downloadable completion certificates' }
];

const TEAM_FEATURES = [
  { text: 'Everything in Pro (up to 5 users)' },
  { text: 'Manager dashboard for team progress' },
  { text: 'Custom curriculum paths' },
  { text: 'Admin controls and learning requirements' },
  { text: 'Bulk licensing workflows' }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#d8eaf8]" style={{ fontFamily: 'Georgia, serif' }}>
            Pricing built for individual growth and team readiness
          </h2>
          <p className="text-[#8aaece]">Start free. Upgrade when you need full infrastructure deployment depth.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex h-full flex-col rounded-xl border border-[#223754] bg-[#0b1524] p-6"
          >
            <PlanHeader title="Free" price="$0" subtitle="Forever free" />

            <ul className="mb-6 flex-1 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  {feature.included ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6f93b2]" />
                  )}
                  <span className={feature.included ? 'text-[#9ab8d4]' : 'text-[#6f93b2]'}>{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full rounded-lg border border-[#2f4f73] py-3 text-center text-sm font-medium text-[#9ab8d4] transition-all hover:border-[#64a0dc] hover:text-[#d8eaf8]"
            >
              Get started free
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[#64a0dc]/40 bg-[#0c182a] p-6"
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #64a0dc, transparent 70%)' }}
            />

            <PlanHeader
              title="Pro"
              price="$29"
              subtitle="per month or $290/year"
              badge="Most popular"
              badgeColor="#64a0dc"
            />

            <ul className="relative mb-6 flex-1 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" />
                  <span className="text-[#9ab8d4]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=pro"
              className="relative block w-full rounded-lg bg-[#64a0dc] py-3 text-center text-sm font-semibold text-[#09111e] transition-all hover:bg-[#8eb9de]"
            >
              Start Pro
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14 }}
            className="flex h-full flex-col rounded-xl border border-[#223754] bg-[#0b1524] p-6"
          >
            <PlanHeader title="Team" price="$99" subtitle="per month / 5 users" />

            <ul className="mb-6 flex-1 space-y-3">
              {TEAM_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4ade80]" />
                  <span className="text-[#9ab8d4]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=team"
              className="block w-full rounded-lg border border-[#2f4f73] py-3 text-center text-sm font-medium text-[#9ab8d4] transition-all hover:border-[#64a0dc] hover:text-[#d8eaf8]"
            >
              Contact sales
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const PlanHeader = ({
  title,
  price,
  subtitle,
  badge,
  badgeColor
}: {
  title: string;
  price: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}) => {
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm text-[#d8eaf8]">{title}</span>
        {badge ? (
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{
              border: `1px solid ${badgeColor}55`,
              background: `${badgeColor}22`,
              color: badgeColor
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <div className="font-mono text-4xl font-bold text-[#d8eaf8]">{price}</div>
      <div className="mt-1 text-xs text-[#6f93b2]">{subtitle}</div>
    </div>
  );
};
