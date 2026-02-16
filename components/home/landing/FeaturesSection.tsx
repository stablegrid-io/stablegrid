'use client';

import { motion } from 'framer-motion';
import { BookOpen, Code2, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpen,
    label: 'Theory',
    headline: 'Deep conceptual docs',
    description:
      'PySpark chapters plus matching guides for SQL, Python, and Fabric. Architecture, internals, and optimization patterns.',
    preview: [
      '⚡ Ch.4: Shuffles — The Performance Killer',
      '⚡ Ch.7: Data Skew — Detecting & Fixing',
      '⚡ Ch.8: Adaptive Query Execution',
      '⚡ Ch.13: Optimization Playbook'
    ],
    color: '#6b7fff',
    footer: '4 topics · chapter-based learning'
  },
  {
    icon: Code2,
    label: 'Functions',
    headline: 'Interactive reference',
    description:
      'Searchable function reference with copy-ready examples. Filter by category and bookmark what you use most.',
    preview: [
      '🔍 Search by name, tag, or keyword',
      '📋 Copy code with one click',
      '🔖 Bookmark your most-used functions',
      '🏷️ Filter by difficulty and category'
    ],
    color: '#10b981',
    footer: 'PySpark, SQL, Python, and Fabric references'
  },
  {
    icon: Zap,
    label: 'Practice',
    headline: 'Flashcard drills',
    description:
      'Difficulty-tiered practice with instant feedback, kWh rewards, streaks, and accuracy tracking.',
    preview: [
      '🎯 Difficulty: Beginner → Advanced',
      '📊 Accuracy tracked per topic',
      '🔥 Streak system for consistency',
      '⚡ kWh generated per correct answer'
    ],
    color: '#f59e0b',
    footer: '440 questions across the question bank'
  }
] as const;

export const FeaturesSection = () => {
  return (
    <section id="features" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold">
            Everything in one place
          </h2>
          <p className="mx-auto max-w-lg text-[#a3a3a3]">
            Theory to understand it. Reference to remember it. Practice to own it.
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
                className="flex flex-col rounded-xl border border-[#1f1f1f] bg-[#111111] p-6 transition-colors hover:border-[#2a2a2a]"
              >
                <div
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${feature.color}15`,
                    border: `1px solid ${feature.color}25`
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>

                <div
                  className="mb-2 text-xs font-medium uppercase tracking-widest"
                  style={{ color: feature.color }}
                >
                  {feature.label}
                </div>
                <h3 className="mb-3 text-base font-semibold">{feature.headline}</h3>
                <p className="mb-5 text-sm leading-relaxed text-[#a3a3a3]">
                  {feature.description}
                </p>

                <div className="mb-5 flex-1 space-y-2">
                  {feature.preview.map((item) => (
                    <div key={item} className="text-xs text-[#525252]">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#1f1f1f] pt-4 text-xs text-[#525252]">
                  {feature.footer}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
