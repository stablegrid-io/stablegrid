'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const TOPICS = [
  {
    id: 'pyspark',
    icon: '⚡',
    label: 'PySpark at Scale',
    version: 'Spark 3.4+',
    chapters: 13,
    functions: 32,
    questions: 45,
    highlights: [
      'Partition strategy and shuffles',
      'Streaming anomaly pipelines',
      'Skew mitigation under bursts',
      'Cost-aware optimization'
    ],
    color: '#f0a032',
    plan: 'Included'
  },
  {
    id: 'fabric',
    icon: '🏗️',
    label: 'Microsoft Fabric',
    version: 'Lakehouse + Pipelines',
    chapters: 5,
    functions: 16,
    questions: 40,
    highlights: [
      'Pipeline orchestration',
      'Lakehouse and warehouse ops',
      'Realtime analytics',
      'Governance and permissions'
    ],
    color: '#78b8f3',
    plan: 'Included'
  }
] as const;

export const TopicsSection = () => {
  return (
    <section id="topics" className="border-t border-[#1a2a22] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#e3efe8]" style={{ fontFamily: 'Georgia, serif' }}>
            Curriculum engineered for the StableGrid loop
          </h2>
          <p className="text-[#9ab8a9]">
            Master the modern data engineering stack — PySpark and Microsoft Fabric.
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
                href={`/learn/${topic.id}/theory`}
                className="group block rounded-xl border border-[#1f3629] bg-[#0d1410] p-5 transition-all hover:border-[#2b4f3a]"
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
                      <p className="text-xs text-[#6f8f7d]">{topic.version}</p>
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
                    <ChevronRight className="h-4 w-4 text-[#6f8f7d] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <div className="mb-4 flex gap-4 border-b border-[#1f3629] pb-4">
                  {[
                    { label: 'chapters', value: topic.chapters },
                    { label: 'functions', value: topic.functions },
                    { label: 'questions', value: topic.questions }
                  ].map((stat) => (
                    <div key={stat.label}>
                      <div className="text-base font-bold" style={{ color: topic.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-[#6f8f7d]">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  {topic.highlights.map((highlight) => (
                    <div key={highlight} className="flex items-center gap-2 text-xs text-[#9ab8a9]">
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
