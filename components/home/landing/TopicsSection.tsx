'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const TOPICS = [
  {
    id: 'sql',
    icon: 'D',
    label: 'SQL for Grid Ops',
    version: 'PostgreSQL dialect',
    chapters: 3,
    functions: 28,
    questions: 18,
    highlights: [
      'CTEs and window functions',
      'Peak-load pattern detection',
      'Dispatch and balancing queries',
      'Operational KPI rollups'
    ],
    color: '#64a0dc',
    plan: 'Free'
  },
  {
    id: 'python',
    icon: 'P',
    label: 'Python for Analysis',
    version: 'Python 3.11+',
    chapters: 3,
    functions: 24,
    questions: 16,
    highlights: [
      'Time-series transformations',
      'Load and generation profiling',
      'Data quality guardrails',
      'Statistical sanity checks'
    ],
    color: '#4ade80',
    plan: 'Free'
  },
  {
    id: 'pyspark',
    icon: 'S',
    label: 'PySpark at Scale',
    version: 'Spark 3.4+',
    chapters: 3,
    functions: 32,
    questions: 16,
    highlights: [
      'Partition strategy and shuffles',
      'Streaming anomaly pipelines',
      'Skew mitigation under bursts',
      'Cost-aware optimization'
    ],
    color: '#f0a032',
    plan: 'Pro'
  },
  {
    id: 'fabric',
    icon: 'F',
    label: 'Microsoft Fabric',
    version: 'Lakehouse + Pipelines',
    chapters: 3,
    functions: 16,
    questions: 0,
    highlights: [
      'Pipeline orchestration',
      'Warehouse operations',
      'Realtime analytics basics',
      'Governance and permissions'
    ],
    color: '#78b8f3',
    plan: 'Pro'
  }
] as const;

export const TopicsSection = () => {
  return (
    <section id="topics" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#d8eaf8]" style={{ fontFamily: 'Georgia, serif' }}>
            Curriculum engineered for the StableGrid loop
          </h2>
          <p className="text-[#8aaece]">
            Start free with SQL + Python. Unlock full PySpark and Fabric tracks in Pro.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2">
          {TOPICS.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={`/learn/${topic.id}`}
                className="group block rounded-xl border border-[#223754] bg-[#0b1524] p-5 transition-all hover:border-[#2f4f73]"
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
                      <h3 className="text-sm font-semibold text-[#d8eaf8]">{topic.label}</h3>
                      <p className="text-xs text-[#6f93b2]">{topic.version}</p>
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
                    <ChevronRight className="h-4 w-4 text-[#6f93b2] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mb-4 flex gap-4 border-b border-[#223754] pb-4">
                  {[
                    { label: 'chapters', value: topic.chapters },
                    { label: 'functions', value: topic.functions },
                    { label: 'questions', value: topic.questions }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-base font-bold" style={{ color: topic.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-[#6f93b2]">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {topic.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-2 text-xs text-[#9ab8d4]">
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
