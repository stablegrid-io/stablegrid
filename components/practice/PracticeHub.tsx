'use client';

import Link from 'next/link';
import { Code2, BrainCircuit, BarChart3, Cpu, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PRACTICE_TOPIC_TIER_MAP } from '@/lib/practice/topicTierMap';
import { getPracticeSet } from '@/data/operations/practice-sets';

/* ── Category definitions ───────────────────────────────────────────────────── */

interface Category {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentRgb: string;
  questionCount: number;
  difficulty: string;
  reward: string;
  comingSoon: boolean;
  image: string;
  imageFilter: string;
  href: string;
}

/**
 * Total live coding tasks across every topic ladder × every tier wired in
 * PRACTICE_TOPIC_TIER_MAP. Computed at module load instead of hardcoded so
 * the Coding card's "Questions" count tracks the catalogue automatically as
 * new tracks ship.
 */
function countLiveCodingTasks(): number {
  let count = 0;
  for (const tierMap of Object.values(PRACTICE_TOPIC_TIER_MAP)) {
    for (const entry of Object.values(tierMap)) {
      if (!entry) continue;
      const set = getPracticeSet(entry.language, entry.practiceSetId);
      if (!set) continue;
      count += set.tasks.length;
    }
  }
  return count;
}

const LIVE_CODING_TASKS = countLiveCodingTasks();

// Alphabetical order by title — Coding, Computer Science, Logic, Math &
// Statistics — so the hub reads predictably regardless of which area the
// user is browsing for.
const CATEGORIES: Category[] = [
  {
    id: 'coding',
    title: 'Coding',
    description:
      'PySpark and pandas drills against fictional power-grid datasets — joins, aggregations, memory & skew, plan reading. Server-graded answers, deep-link straight back into the lesson when you miss.',
    icon: Code2,
    accentRgb: '153,247,255',
    questionCount: LIVE_CODING_TASKS,
    difficulty: 'Junior · Mid · Senior',
    reward: '+5–18 kWh',
    comingSoon: false,
    image: '/brand/practice-coding.png',
    imageFilter: '',
    href: '/practice/coding',
  },
  {
    id: 'computer-science',
    title: 'Computer Science',
    description:
      'Data structures, algorithms, complexity, distributed systems, concurrency, memory hierarchies. The foundations under everything — landing soon.',
    icon: Cpu,
    accentRgb: '34,197,94',
    questionCount: 0,
    difficulty: '—',
    reward: '—',
    // No subtopics live yet — every nested topic in
    // ComputerScienceTopicSelector ships `comingSoon: true`. Until at least
    // one is live, the hub card honestly reflects that.
    comingSoon: true,
    image: '/brand/practice-cs.png',
    imageFilter: '',
    href: '/practice/computer-science',
  },
  {
    id: 'logic',
    title: 'Logic',
    description:
      'Predicate logic, set reasoning, pattern recognition, structural deduction. The thinking muscle behind engineering decisions — landing soon.',
    icon: BrainCircuit,
    accentRgb: '191,129,255',
    questionCount: 0,
    difficulty: '—',
    reward: '—',
    comingSoon: true,
    image: '/brand/practice-logic.png',
    imageFilter: '',
    href: '/practice/logic',
  },
  {
    id: 'math-statistics',
    title: 'Math & Statistics',
    description:
      'Descriptive stats, distributions, sampling, regression, time series, big-data math. Statistical reasoning for data engineers — landing soon.',
    icon: BarChart3,
    accentRgb: '255,201,101',
    questionCount: 0,
    difficulty: '—',
    reward: '—',
    comingSoon: true,
    image: '/brand/practice-math.png',
    imageFilter: '',
    href: '/practice/math-statistics',
  },
];

/* ── Category Card ──────────────────────────────────────────────────────────── */

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const Icon = category.icon;
  const rgb = category.accentRgb;

  return (
    <div
      className="group relative h-full"
      style={{
        opacity: 0,
        animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 80 + 100}ms forwards`,
      }}
    >
      <div
        className="relative overflow-hidden h-full flex flex-col md:flex-row transition-all duration-300 cursor-pointer"
        style={{
          background: '#181c20',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 22,
          minHeight: 220,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Banner image — top on mobile, left on desktop */}
        <div className="relative h-32 md:h-auto md:w-72 md:shrink-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${category.image})`,
              filter: category.imageFilter,
            }}
          />
          {/* Fade — bottom on mobile, right on desktop */}
          <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(to bottom, transparent 20%, #181c20 95%)' }} />
          <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(to right, transparent 55%, #181c20 100%)' }} />

          {/* Accent line — top on mobile, left on desktop */}
          <div
            className="absolute top-0 left-0 right-0 md:hidden transition-all duration-300"
            style={{ height: 2, background: `linear-gradient(90deg, transparent 5%, rgba(${rgb}, 0.5), transparent 95%)` }}
          />
          <div
            className="absolute top-0 bottom-0 left-0 hidden md:block transition-all duration-300"
            style={{ width: 2, background: `linear-gradient(180deg, transparent 5%, rgba(${rgb}, 0.5), transparent 95%)` }}
          />
        </div>

        <div className="px-5 pt-5 pb-6 md:px-6 md:py-5 flex flex-col flex-1 min-w-0">
          {/* Title */}
          <h3
            className="text-2xl font-bold tracking-tight uppercase mb-1"
            style={{ color: '#f0f0f3' }}
          >
            {category.title}
          </h3>

          {/* Subtitle */}
          <p
            className="font-mono text-[9px] tracking-[0.15em] uppercase mb-3"
            style={{ color: `rgb(${rgb})` }}
          >
            {category.id === 'coding' ? 'Python · SQL · PySpark' :
             category.id === 'logic' ? 'Patterns · Deduction' :
             category.id === 'math-statistics' ? 'Aggregations · Distributions' :
             category.id === 'computer-science' ? 'Algorithms · Systems · Data Structures' :
             ''}
          </p>

          {/* Description — clamped on mobile to keep the card scannable;
              full text on tablet+. */}
          <p
            className="text-[12px] leading-relaxed mb-5 md:mb-4 line-clamp-2 md:line-clamp-none"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {category.description}
          </p>

          {/* Bottom row: stats inline (desktop) / stacked (mobile) + CTA */}
          <div className="mt-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:gap-5">
              {[
                { label: 'Tasks', value: category.comingSoon ? '—' : String(category.questionCount) },
                { label: 'Difficulty', value: category.difficulty },
                { label: 'kWh per task', value: category.reward },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between md:justify-start md:gap-2 py-2.5 md:py-0"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {stat.label}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            {category.comingSoon ? (
              <div
                className="w-full md:w-auto md:shrink-0 py-3.5 md:py-2.5 px-4 md:px-5 font-mono text-[10px] font-bold tracking-widest text-center uppercase"
                style={{
                  border: '1px dashed rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                Under Construction
              </div>
            ) : (
              <div
                className="w-full md:w-auto md:shrink-0 py-3.5 md:py-2.5 px-4 md:px-5 font-mono text-[10px] font-bold tracking-widest text-center uppercase flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:bg-on-surface/[0.04]"
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                Start
                <ArrowRight className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Practice Hub ───────────────────────────────────────────────────────────── */

export function PracticeHub() {
  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-12">

        {/* Header */}
        <header
          className="border-b border-on-surface/[0.08] pb-6"
          style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards' }}
        >
          <h1 className="text-5xl font-bold tracking-tight text-on-surface">
            Practice Lab
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-on-surface/60">
            Theory builds the map. Practice builds the reflex. Four disciplines, drilled until hesitation
            turns into instinct &mdash; the kind of fluency you only earn by doing the rep one more time.
          </p>
        </header>

        {/* Category grid */}
        <div className="grid grid-cols-1 gap-5">
          {CATEGORIES.map((cat, i) =>
            cat.comingSoon ? (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ) : (
              <Link key={cat.id} href={cat.href} className="block h-full">
                <CategoryCard category={cat} index={i} />
              </Link>
            )
          )}
        </div>

      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
