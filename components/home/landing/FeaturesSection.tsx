'use client';

import { motion } from 'framer-motion';
import { BookOpen, Network, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    label: 'Curriculum',
    headline: 'Flagship PySpark depth with grid context',
    description:
      'The deepest path focuses on distributed data engineering with utility-scale examples: shuffles, skew, streaming, telemetry quality, governance, and platform design.',
    preview: [
      '20 PySpark chapters live today',
      'Production-style examples and diagrams',
      'Interview and system design framing',
      'Prerequisite-gated progression'
    ],
    color: '#4ade80',
    footer: 'Built for practitioners who need judgment, not surface coverage'
  },
  {
    icon: Zap,
    label: 'Progression',
    headline: 'Progression with consequences, not vanity XP',
    description:
      'kWh is an earned deployment budget. Progress changes what users can deploy next and makes analytical skill visible inside the simulation.',
    preview: [
      'Questions and missions award kWh',
      'Chapters expand deployment authority',
      'Higher stability unlocks harder scenarios',
      'Dashboard tracks momentum and accuracy'
    ],
    color: '#f0a032',
    footer: 'Your progress changes the system instead of ending at a completion bar'
  },
  {
    icon: Network,
    label: 'Missions',
    headline: 'Incident-style missions for infrastructure-heavy domains',
    description:
      'Mission briefs are written like real incidents: event-order inversions, schema regressions, telemetry storms, dispatch windows, and renewable volatility.',
    preview: [
      'Ghost events and telemetry loss',
      'Streaming lag and watermark recovery',
      'Storage dispatch under price spikes',
      'Forensics-style incident debriefs'
    ],
    color: '#64a0dc',
    footer: 'That scenario framing is the differentiator, not decoration'
  }
] as const;

export const FeaturesSection = () => {
  return (
    <section id="features" className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            The moat is the loop, not a bigger content library
          </h2>
          <p className="mx-auto max-w-2xl text-[#9ab8a9]">
            StableGrid ties deep PySpark learning, domain pressure, and visible system state into one progression model. That is what makes it harder to substitute with another course or quiz app.
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
                className="flex flex-col rounded-xl border border-[#1f3629] bg-[#0d1410] p-6 transition-colors hover:border-[#2b4f3a]"
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
                <h3 className="mb-3 text-base font-semibold text-[#e3efe8]">{feature.headline}</h3>
                <p className="mb-5 text-sm leading-relaxed text-[#9ab8a9]">{feature.description}</p>

                <div className="mb-5 flex-1 space-y-2">
                  {feature.preview.map((item) => (
                    <div key={item} className="text-xs text-[#6f8f7d]">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1f3629] pt-4 text-xs text-[#6f8f7d]">{feature.footer}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
