'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { trackProductEvent } from '@/lib/analytics/productAnalytics';

const FREE_FEATURES = [
  { text: 'Preview the flagship PySpark route', included: true },
  { text: 'Use Theory session modes (Pomodoro, Deep Focus, Sprint, Free Read)', included: true },
  { text: 'Track chapter completion and resume state', included: true },
  { text: 'Create an account without a card', included: true },
  { text: 'Open the home console and progress views after signup', included: true },
  { text: 'Billing controls and upgrade path', included: false },
  { text: 'Expanded premium access surfaces', included: false }
];

const PRO_FEATURES = [
  { text: 'Everything in Free' },
  { text: '20 live PySpark chapters' },
  { text: 'Priority access to new chapters and theory features' },
  { text: 'Early access for future practice and mission rollouts' },
  { text: 'Billing and plan management in settings' }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="border-t border-[#1a2a22] py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[#e3efe8] md:text-3xl" style={{ fontFamily: 'Georgia, serif' }}>
            Pricing built for focused individual growth
          </h2>
          <p className="text-sm text-[#9ab8a9] md:text-base">Start free. Inspect the full theory route before you decide to upgrade.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex h-full flex-col rounded-xl border border-[#1f3629] bg-[#0d1410] p-5"
          >
            <PlanHeader title="Free" price="$0" subtitle="Forever free" />

            <ul className="mb-5 flex-1 space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2.5 text-[0.95rem]">
                  {feature.included ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22b999]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#6f93b2]" />
                  )}
                  <span className={feature.included ? 'text-[#9ab8d4]' : 'text-[#6f93b2]'}>{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login"
              onClick={() => {
                void trackProductEvent('landing_cta', {
                  source: 'pricing_free'
                });
              }}
              className="block w-full rounded-lg border border-[#2b4f3a] py-2.5 text-center text-sm font-medium text-[#9ab8a9] transition-all hover:border-[#22b999] hover:text-[#e3efe8]"
            >
              Get started free
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[#22b999]/45 bg-[#0f1712] p-5"
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #22b999, transparent 70%)' }}
            />

            <PlanHeader
              title="Pro"
              price="$9.99"
              subtitle="per month"
              badge="Most popular"
              badgeColor="#22b999"
            />

            <ul className="relative mb-5 flex-1 space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-2.5 text-[0.95rem]">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#22b999]" />
                  <span className="text-[#9ab8a9]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=pro"
              onClick={() => {
                void trackProductEvent('landing_cta', {
                  source: 'pricing_pro'
                });
              }}
              className="relative block w-full rounded-lg bg-[#22b999] py-2.5 text-center text-sm font-semibold text-[#08110b] transition-all hover:bg-[#6fe89a]"
            >
              Start Pro
            </Link>
          </motion.div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#1f3629] bg-[#0d1410] px-5 py-4 text-sm text-[#9ab8a9] sm:flex-row sm:items-center sm:justify-between">
          <p>Inspect the real product surfaces before you create an account.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/learn/pyspark/theory"
              className="font-medium text-[#e3efe8] transition-colors hover:text-[#22b999]"
            >
              Preview PySpark path
            </Link>
            <Link
              href="/theory"
              className="font-medium text-[#e3efe8] transition-colors hover:text-[#22b999]"
            >
              Open Theory topics
            </Link>
          </div>
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
    <div className="mb-4">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm text-[#e3efe8]">{title}</span>
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
      <div className="font-mono text-3xl font-bold text-[#e3efe8] md:text-4xl">{price}</div>
      <div className="mt-1 text-xs text-[#6f8f7d]">{subtitle}</div>
    </div>
  );
};
