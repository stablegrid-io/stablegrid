'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Solve domain-specific work',
    body: 'Work through the flagship PySpark path, supporting drills, and grid incident missions built around real operational failure modes.',
    detail: 'The unit of progress is not content watched. It is problems reasoned through.'
  },
  {
    number: '02',
    title: 'Earn deployment authority',
    body: 'kWh acts like trust inside the platform. The better you perform, the more of the grid you are allowed to shape.',
    detail: 'Progress becomes visible capability instead of an abstract XP number.'
  },
  {
    number: '03',
    title: 'Change the system state',
    body: 'Deploy infrastructure, raise stability, and unlock more demanding scenarios that test judgment under pressure.',
    detail: 'Theory, practice, and simulation stay tied to the same operational outcome.'
  }
] as const;

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            Why the product sticks
          </h2>
          <p className="text-[#9ab8a9]">Skill turns into authority, and authority changes the system.</p>
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
