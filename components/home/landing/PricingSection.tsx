'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

const FREE_FEATURES = [
  { text: 'SQL topic — full access', included: true },
  { text: 'Python topic — full access', included: true },
  { text: '50 practice questions/month', included: true },
  { text: 'Function reference (SQL + Python)', included: true },
  { text: 'Progress tracking', included: true },
  { text: 'PySpark topic', included: false },
  { text: 'Microsoft Fabric topic', included: false },
  { text: 'Unlimited questions', included: false },
  { text: 'Code execution', included: false }
];

const PRO_FEATURES = [
  { text: 'Everything in Free' },
  { text: 'PySpark topic — full theory + reference + drills' },
  { text: 'Microsoft Fabric topic' },
  { text: 'Unlimited practice questions' },
  { text: 'In-browser code execution' },
  { text: 'Advanced analytics and heatmaps' },
  { text: 'Priority support' }
];

export const PricingSection = () => {
  return (
    <section id="pricing" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold">Simple pricing</h2>
          <p className="text-[#a3a3a3]">Start free. Upgrade when you need PySpark.</p>
        </div>

        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex h-full flex-col rounded-xl border border-[#1f1f1f] bg-[#111111] p-6"
          >
            <div className="mb-5">
              <div className="mb-1 text-sm text-[#a3a3a3]">Free</div>
              <div className="font-mono text-4xl font-bold">$0</div>
              <div className="mt-1 text-xs text-[#525252]">Forever free — no card</div>
            </div>

            <ul className="mb-6 flex-1 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  {feature.included ? (
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#525252]" />
                  )}
                  <span className={feature.included ? 'text-[#a3a3a3]' : 'text-[#525252]'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full rounded-lg border border-[#2a2a2a] py-3 text-center text-sm font-medium text-[#a3a3a3] transition-all hover:border-[#444] hover:text-white"
            >
              Get started free
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[#10b981]/40 bg-[#111111] p-6"
          >
            <div
              className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full opacity-5"
              style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
            />

            <div className="relative mb-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm text-[#10b981]">Pro</span>
                <span className="rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-2 py-0.5 text-xs text-[#10b981]">
                  Most popular
                </span>
              </div>
              <div className="font-mono text-4xl font-bold">$12</div>
              <div className="mt-1 text-xs text-[#525252]">per month · cancel anytime</div>
            </div>

            <ul className="relative mb-6 flex-1 space-y-3">
              {PRO_FEATURES.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10b981]" />
                  <span className="text-[#a3a3a3]">{feature.text}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup?plan=pro"
              className="relative block w-full rounded-lg bg-[#10b981] py-3 text-center text-sm font-medium text-white transition-all hover:bg-[#059669]"
            >
              Start Pro — $12/month
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
