'use client';

import Link from 'next/link';
import { Code2, BrainCircuit, BarChart3, Zap, Cpu, Lock, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── Category definitions ───────────────────────────────────────────────────── */

interface Category {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accentRgb: string;
  questionCount: number;
  comingSoon: boolean;
  image: string;
  imageFilter: string;
  href: string;
}

const CATEGORIES: Category[] = [
  {
    id: 'coding',
    title: 'Coding',
    description: 'Python, SQL, and PySpark challenges. Write transforms, fix queries, debug pipelines. Real code, real feedback.',
    icon: Code2,
    accentRgb: '153,247,255',
    questionCount: 0,
    comingSoon: false,
    image: '/brand/practice-coding.png',
    imageFilter: '',
    href: '/practice/coding',
  },
  {
    id: 'logic',
    title: 'Logic',
    description: 'Pattern recognition, logical deduction, sequence puzzles. Train the thinking muscle behind engineering decisions.',
    icon: BrainCircuit,
    accentRgb: '191,129,255',
    questionCount: 0,
    comingSoon: true,
    image: '/brand/practice-logic.png',
    imageFilter: '',
    href: '/practice/logic',
  },
  {
    id: 'math-statistics',
    title: 'Math & Statistics',
    description: 'Aggregations, distributions, window functions, statistical reasoning for data engineers.',
    icon: BarChart3,
    accentRgb: '255,201,101',
    questionCount: 0,
    comingSoon: true,
    image: '/brand/practice-math.png',
    imageFilter: '',
    href: '/practice/math-statistics',
  },
  {
    id: 'grid-electricity',
    title: 'Grid & Electricity',
    description: 'Energy systems, load balancing, meter data, grid stability. The NordGrid domain.',
    icon: Zap,
    accentRgb: '255,113,108',
    questionCount: 0,
    comingSoon: true,
    image: '/brand/practice-grid.png',
    imageFilter: '',
    href: '/practice/grid-electricity',
  },
  {
    id: 'computer-science',
    title: 'Computer Science',
    description: 'Data structures, algorithms, complexity, systems design. The foundations under everything.',
    icon: Cpu,
    accentRgb: '34,197,94',
    questionCount: 0,
    comingSoon: true,
    image: '/brand/practice-cs.png',
    imageFilter: '',
    href: '/practice/computer-science',
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
        className="relative overflow-hidden h-full flex flex-col transition-all duration-300 cursor-pointer"
        style={{
          background: '#111416',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 22,
          minHeight: 420,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-6px)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Banner image */}
        <div className="relative h-32 overflow-hidden shrink-0">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{
              backgroundImage: `url(${category.image})`,
              filter: category.imageFilter,
            }}
          />
          {/* Bottom fade */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, #111416 95%)' }} />

          {/* Top accent line */}
          <div
            className="absolute top-0 left-0 right-0 transition-all duration-300"
            style={{ height: 2, background: `linear-gradient(90deg, transparent 5%, rgba(${rgb}, 0.5), transparent 95%)` }}
          />
        </div>

        {/* Badge */}
        <div className="px-5 -mt-2">
          {category.comingSoon ? (
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[9px] px-2 py-0.5 uppercase rounded-full"
              style={{ color: 'rgba(255,255,255,0.35)', border: '1px dashed rgba(255,255,255,0.1)' }}
            >
              <Lock className="w-2.5 h-2.5" />
              Soon
            </span>
          ) : (
            <span
              className="inline-flex font-mono text-[9px] px-2 py-0.5 uppercase rounded-full"
              style={{ color: `rgb(${rgb})`, border: `1px solid rgba(${rgb}, 0.25)`, backgroundColor: `rgba(${rgb}, 0.06)` }}
            >
              {category.questionCount} questions
            </span>
          )}
        </div>

        <div className="px-5 pt-4 pb-6 flex flex-col flex-1">
          {/* Title */}
          <h3
            className="text-2xl font-bold tracking-tight uppercase mb-1"
            style={{ color: '#f0f0f3' }}
          >
            {category.title}
          </h3>

          {/* Subtitle */}
          <p
            className="font-mono text-[9px] tracking-[0.15em] uppercase mb-5"
            style={{ color: `rgb(${rgb})` }}
          >
            {category.id === 'coding' ? 'Python · SQL · PySpark' :
             category.id === 'logic' ? 'Patterns · Deduction' :
             category.id === 'math-statistics' ? 'Aggregations · Distributions' :
             'Energy · Load · Meters'}
          </p>

          {/* Description */}
          <p
            className="text-[12px] leading-relaxed mb-8"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            {category.description}
          </p>

          {/* Stats */}
          <div className="mt-auto space-y-0">
            {[
              { label: 'Questions', value: category.comingSoon ? '—' : String(category.questionCount) },
              { label: 'Difficulty', value: category.comingSoon ? '—' : 'Mixed' },
              { label: 'kWh per correct', value: category.comingSoon ? '—' : '+5' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between py-2.5"
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
          <div className="mt-4">
            {category.comingSoon ? (
              <div
                className="w-full py-3.5 font-mono text-[10px] font-bold tracking-widest text-center uppercase rounded-[14px]"
                style={{
                  border: '1px dashed rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.25)',
                }}
              >
                Under Construction
              </div>
            ) : (
              <div
                className="w-full py-3.5 font-mono text-[10px] font-bold tracking-widest text-center uppercase rounded-[14px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer hover:bg-white/[0.04]"
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
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <header
          className="mb-12 border-l-2 border-primary pl-6"
          style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards' }}
        >
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface uppercase mb-2">
            Practice <span className="text-primary">Lab</span>
          </h1>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 480 }}>
            Targeted drills across four disciplines. Pick a category and start sharpening.
          </p>
        </header>

        {/* Category grid — 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
