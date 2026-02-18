'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Complete learning tasks',
    body: 'Work through chapters, function drills, and mission exercises in SQL, Python, PySpark, and statistics.',
    detail: 'Practice answers award 0.04-0.12 kWh and chapter completions award 0.15 kWh.'
  },
  {
    number: '02',
    title: 'Earn kWh deployment budget',
    body: 'kWh is proof of analytical competency. The more you earn, the more infrastructure you are trusted to deploy.',
    detail: 'Mission rewards scale from 0.4 to 2.4 kWh based on complexity.'
  },
  {
    number: '03',
    title: 'Deploy infrastructure and stabilize the grid',
    body: 'Spend kWh on assets like battery storage, frequency control, and demand response to raise grid stability.',
    detail: 'Higher stability unlocks advanced content and harder operational missions.'
  }
] as const;

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            Learning -&gt; Infrastructure -&gt; Stability
          </h2>
          <p className="text-[#9ab8a9]">A professional progression loop with operational consequences.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="absolute left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] top-8 hidden h-px bg-[#1f3629] md:block" />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#4ade80]/30 bg-[#4ade80]/10">
                <span className="font-mono text-lg font-bold text-[#4ade80]">{step.number}</span>
              </div>

              <h3 className="mb-2 text-base font-semibold text-[#e3efe8]">{step.title}</h3>
              <p className="mb-3 text-sm leading-relaxed text-[#9ab8a9]">{step.body}</p>
              <p className="text-xs leading-relaxed text-[#6f8f7d]">{step.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
