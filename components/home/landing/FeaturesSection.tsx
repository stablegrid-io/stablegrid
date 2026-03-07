'use client';

import { motion } from 'framer-motion';
import { BookOpen, Clock3, Compass } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    label: 'Theory route',
    metric: '20 live chapters',
    headline: 'A single PySpark path with real operating context',
    description:
      'Start with one structured route instead of a content maze. The flagship path focuses on distributed data engineering inside utility-scale scenarios.',
    preview: [
      'Production-style examples and diagrams',
      'Shuffles, skew, streaming, and telemetry quality',
      'System design framing that stays grounded in operations'
    ],
    color: '#22b999',
    footer: 'Best first move: open the PySpark route and finish chapter 1.'
  },
  {
    icon: Clock3,
    label: 'Session layer',
    metric: '4 study modes',
    headline: 'Session controls built directly into the theory flow',
    description:
      'Pick Pomodoro, Deep Focus, Sprint, or Free Read and keep your reading rhythm consistent without leaving the chapter view.',
    preview: [
      'Session picker opens in-line from theory',
      'Break overlays and completion summaries',
      'Settings-driven defaults per user'
    ],
    color: '#f0a032',
    footer: 'Best first move: choose one session mode before you start reading.'
  },
  {
    icon: Compass,
    label: 'Beta scope',
    metric: 'Theory-only launch',
    headline: 'What is shipping now vs what is intentionally next',
    description:
      'This release is intentionally scoped to Theory Beta. Practice, flashcards, and mission layers stay out of primary navigation until they are production-ready.',
    preview: [
      'No dead-end primary navigation',
      'Explicit launch copy across landing and auth',
      'Clear expectation setting before signup'
    ],
    color: '#64a0dc',
    footer: 'Best first move: complete Theory Beta before enabling new mode surfaces.'
  }
] as const;

export const FeaturesSection = () => {
  return (
    <section id="features" className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7fb99a]">
            What you can use today
          </p>
          <h2
            className="mb-4 text-3xl font-bold text-[#e3efe8]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Theory Beta ships one clear route.
          </h2>
          <p className="mx-auto max-w-2xl text-[#9ab8a9]">
            The current release focuses on reliable theory progression and study sessions.
            Additional learning modes will be enabled after this scope is fully complete.
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
                <p className="mb-2 text-sm font-semibold" style={{ color: feature.color }}>
                  {feature.metric}
                </p>
                <h3 className="mb-3 text-base font-semibold text-[#e3efe8]">{feature.headline}</h3>
                <p className="mb-5 text-sm leading-relaxed text-[#9ab8a9]">{feature.description}</p>

                <div className="mb-5 flex-1 space-y-2">
                  {feature.preview.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-[#9ab8a9]">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: feature.color }}
                      />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1f3629] pt-4 text-xs text-[#6f8f7d]">{feature.footer}</div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-[#1f3629] bg-[#0d1410] px-5 py-4 text-sm text-[#9ab8a9]">
          Start simple: open the route, finish one chapter, and keep a steady reading rhythm.
          Practice and mission layers are intentionally staged for later rollout.
        </div>
      </div>
    </section>
  );
};
