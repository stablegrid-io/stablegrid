'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Follow one structured route',
    body: 'Work through the flagship PySpark curriculum in sequence so every module builds on the previous one.',
    detail: 'The unit of progress is lessons understood, not tabs opened.'
  },
  {
    number: '02',
    title: 'Keep continuity',
    body: 'Resume the last chapter reliably after refresh or relogin and keep the reading loop deterministic.',
    detail: 'Progress tracking stays tied to chapter completion and lesson resume state.'
  },
  {
    number: '03',
    title: 'Expand in phases',
    body: 'Practice, flashcards, and missions are introduced only after the full theory catalog reaches launch quality.',
    detail: 'Scope discipline now prevents broken expectations later.'
  }
] as const;

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="border-t border-grid-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            How the theory route works
          </h2>
          <p className="text-grid-text">One stable route first, expansion layers after validation.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] top-8 hidden h-px bg-grid-border md:block" />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-grid-glow/30 bg-grid-glow/10">
                <span className="font-mono text-lg font-bold text-grid-glow">{step.number}</span>
              </div>

              <h3 className="mb-2 text-base font-semibold text-[#e3efe8]">{step.title}</h3>
              <p className="mb-3 text-sm leading-relaxed text-grid-text">{step.body}</p>
              <p className="text-xs leading-relaxed text-grid-text-dim">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
