'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const TOPICS = [
  {
    id: 'pyspark',
    icon: '⚡',
    label: 'PySpark',
    version: 'Spark 3.4+',
    chapters: 13,
    functions: 87,
    questions: 45,
    highlights: [
      'Shuffles and partitioning',
      'Adaptive Query Execution',
      'Data skew and salting',
      'Delta Lake internals',
      'Structured Streaming'
    ],
    color: '#f59e0b',
    pro: true
  },
  {
    id: 'sql',
    icon: '🗄️',
    label: 'SQL',
    version: 'ANSI SQL',
    chapters: 1,
    functions: 4,
    questions: 60,
    highlights: [
      'Window functions',
      'CTEs and subqueries',
      'Execution-order mental model',
      'Join patterns',
      'Performance basics'
    ],
    color: '#6b7fff',
    pro: false
  },
  {
    id: 'python',
    icon: '🐍',
    label: 'Python / Pandas',
    version: 'Pandas 2.x',
    chapters: 1,
    functions: 4,
    questions: 50,
    highlights: [
      'GroupBy patterns',
      'Vectorized operations',
      'Memory-aware wrangling',
      'merge and concat patterns',
      'Datetime handling'
    ],
    color: '#10b981',
    pro: false
  },
  {
    id: 'fabric',
    icon: '🏗️',
    label: 'Microsoft Fabric',
    version: 'Fabric',
    chapters: 5,
    functions: 6,
    questions: 0,
    highlights: [
      'OneLake and Lakehouse model',
      'Pipelines and orchestration',
      'Warehouse and MERGE workflows',
      'Real-Time Analytics basics',
      'Governance and production setup'
    ],
    color: '#06b6d4',
    pro: true
  }
] as const;

export const TopicsSection = () => {
  return (
    <section id="topics" className="border-t border-[#1f1f1f] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold">Topics built for real work</h2>
          <p className="text-[#a3a3a3]">
            SQL and Python are free forever. Unlock PySpark and Fabric with Pro.
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
                className="group block rounded-xl border border-[#1f1f1f] bg-[#111111] p-5 transition-all hover:border-[#2a2a2a]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{topic.icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold">{topic.label}</h3>
                      <p className="text-xs text-[#525252]">{topic.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {topic.pro ? (
                      <span className="rounded-full border border-[#f59e0b]/20 bg-[#f59e0b]/10 px-2 py-0.5 text-xs font-medium text-[#f59e0b]">
                        Pro
                      </span>
                    ) : (
                      <span className="rounded-full border border-[#10b981]/20 bg-[#10b981]/10 px-2 py-0.5 text-xs font-medium text-[#10b981]">
                        Free
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-[#525252] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mb-4 flex gap-4 border-b border-[#1f1f1f] pb-4">
                  {[
                    { label: 'chapters', value: topic.chapters },
                    { label: 'functions', value: topic.functions },
                    { label: 'questions', value: topic.questions }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-base font-bold" style={{ color: topic.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-[#525252]">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {topic.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-2 text-xs text-[#a3a3a3]">
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
