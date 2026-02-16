'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Pick a topic',
    body: 'Start with SQL or Python for free, or jump into PySpark and Fabric with Pro.',
    detail:
      'Each topic combines theory, reference docs, and practice so you can move from concept to execution without switching tools.'
  },
  {
    number: '02',
    title: 'Read the theory',
    body: 'Use chapter docs with architecture diagrams, optimization notes, and executable examples.',
    detail:
      'Your reading state is tracked, so you can return exactly where you left off.'
  },
  {
    number: '03',
    title: 'Practice what you learned',
    body: 'Run through flashcards with immediate feedback, kWh rewards, and accuracy tracking.',
    detail:
      'Practice outcomes are tied back to topics, so weak areas are visible quickly.'
  }
] as const;

export const HowItWorksSection = () => {
  return (
    <section className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold">How it works</h2>
          <p className="text-[#a3a3a3]">Three steps. No fluff.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] top-8 hidden h-px bg-[#1f1f1f] md:block" />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#6b7fff]/30 bg-[#6b7fff]/10">
                <span className="font-mono text-lg font-bold text-[#6b7fff]">
                  {step.number}
                </span>
              </div>

              <h3 className="mb-2 text-base font-semibold">{step.title}</h3>
              <p className="mb-3 text-sm leading-relaxed text-[#a3a3a3]">{step.body}</p>
              <p className="text-xs leading-relaxed text-[#525252]">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
