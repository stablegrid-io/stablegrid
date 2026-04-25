'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const TOPICS = [
  {
    id: 'pyspark',
    href: '/learn/pyspark/theory',
    icon: '⚡',
    label: 'Flagship PySpark path',
    version: '20 chapters live',
    stats: [
      { label: 'chapters', value: '20' },
      { label: 'session modes', value: '4' },
      { label: 'scope', value: 'Theory' }
    ],
    highlights: [
      'Shuffles, skew, and partition strategy',
      'Streaming anomalies and watermarking',
      'Quality, governance, and Delta operations',
      'Interview, system design, and portfolio framing'
    ],
    color: '#f0a032',
    plan: 'Core path'
  }
] as const;

export const TopicsSection = () => {
  return (
    <section id="topics" className="border-t border-grid-border py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            Theory coverage
          </h2>
          <p className="text-grid-text">
            The current public scope is one flagship theory route. Additional mode cards will appear as each layer reaches launch quality.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-1 lg:grid-cols-1">
          {TOPICS.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={topic.href}
                className="group block rounded-xl border border-grid-border bg-grid-panel p-5 transition-all hover:border-[#2b4f3a]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold"
                      style={{
                        background: `${topic.color}22`,
                        color: topic.color,
                        border: `1px solid ${topic.color}44`
                      }}
                    >
                      {topic.icon}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#e3efe8]">{topic.label}</h3>
                      <p className="text-xs text-grid-text-dim">{topic.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{
                        border: `1px solid ${topic.color}44`,
                        background: `${topic.color}1c`,
                        color: topic.color
                      }}
                    >
                      {topic.plan}
                    </span>
                    <ChevronRight className="h-4 w-4 text-grid-text-dim transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mb-4 flex gap-4 border-b border-grid-border pb-4">
                  {topic.stats.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-base font-bold" style={{ color: topic.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-grid-text-dim">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {topic.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-2 text-xs text-grid-text">
                      <div
                        className="h-1 w-1 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: topic.color }}
                      />
                      {highlight}
                    </div>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
