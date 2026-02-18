'use client';

import { motion } from 'framer-motion';
import { BookOpen, Network, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    label: 'Curriculum',
    headline: 'Theory with operational context',
    description:
      'Chapter-based learning for SQL, Python, PySpark, statistics, and Fabric with production-style examples and progressive prerequisites.',
    preview: [
      '3 core chapters per subject in MVP',
      'Inline code and architecture diagrams',
      'Completion tracking across all topics',
      'Prerequisite-gated progression'
    ],
    color: '#64a0dc',
    footer: 'Learn the concepts behind reliable grid analytics'
  },
  {
    icon: Zap,
    label: 'Practice',
    headline: 'kWh-based competency scoring',
    description:
      'Every solved question and mission awards kWh credits that act as deployment authority for grid infrastructure.',
    preview: [
      '+0.04-0.12 kWh per question',
      '+0.15 kWh per chapter',
      '+0.4-2.4 kWh per mission',
      'Instant feedback and answer rationale'
    ],
    color: '#f0a032',
    footer: 'Not points for fun. Credits for real deployment decisions.'
  },
  {
    icon: Network,
    label: 'Infrastructure',
    headline: 'Live stability map',
    description:
      'Deploy smart transformers, battery storage, frequency controllers, and AI optimization to stabilize renewable variability in simulation.',
    preview: [
      'Locked / Ready / Deployed node states',
      'Animated power-flow connections',
      'Battery, forecast, and frequency indicators',
      'Stability tiers from Critical to Optimal'
    ],
    color: '#4ade80',
    footer: 'Your learning directly changes system outcomes'
  }
] as const;

export const FeaturesSection = () => {
  return (
    <section id="features" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Built for data engineers in infrastructure-heavy domains
          </h2>
          <p className="mx-auto max-w-2xl text-[#8aaece]">
            StableGrid combines technical learning, deployment economics, and a live grid simulation into one progression system.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col rounded-xl border border-[#223754] bg-[#0b1524] p-6 transition-colors hover:border-[#2f4f73]"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${feature.color}18`,
                    border: `1px solid ${feature.color}33`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>

                <div
                  className="mb-2 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: feature.color }}
                >
                  {feature.label}
                </div>
                <h3 className="mb-3 text-base font-semibold text-[#d8eaf8]">{feature.headline}</h3>
                <p className="mb-5 text-sm leading-relaxed text-[#9ab8d4]">{feature.description}</p>

                <div className="mb-5 flex-1 space-y-2">
                  {feature.preview.map((item) => (
                    <div key={item} className="text-xs text-[#6f93b2]">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#223754] pt-4 text-xs text-[#6f93b2]">{feature.footer}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
