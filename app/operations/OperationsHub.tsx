'use client';

import Link from 'next/link';
import { Target, Cpu, Swords } from 'lucide-react';

const OPERATIONS = [
  {
    id: 'challenges',
    title: 'Challenges',
    eyebrow: 'Applied Scenarios',
    description: 'Multi-step challenges that simulate real-world data engineering problems. Combine knowledge from multiple modules to build, debug, and optimize production-grade pipelines.',
    icon: Swords,
    accentRgb: '153,247,255',
    stats: [
      { label: 'Format', value: 'Scenarios' },
      { label: 'Difficulty', value: 'Progressive' },
      { label: 'Scoring', value: 'Performance' },
    ],
    scenario: 'End-to-end pipeline challenges',
    tech: 'Cross-domain integration tasks',
    href: '/operations/challenges',
    status: 'coming_soon' as const,
  },
  {
    id: 'projects',
    title: 'Projects',
    eyebrow: 'Portfolio Builders',
    description: 'Build complete data engineering projects from scratch. Design architectures, implement pipelines, and deploy solutions that demonstrate production-level skills.',
    icon: Cpu,
    accentRgb: '255,201,101',
    stats: [
      { label: 'Format', value: 'End-to-End' },
      { label: 'Difficulty', value: 'Advanced' },
      { label: 'Output', value: 'Portfolio' },
    ],
    scenario: 'Full project implementations',
    tech: 'Multi-tool, multi-platform builds',
    href: '/operations/projects',
    status: 'coming_soon' as const,
  },
];

export function OperationsHub() {
  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Header */}
        <header className="mb-14 max-w-3xl" style={{ opacity: 0, animation: 'fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-on-surface mb-3">
            Operations
          </h1>
          <p className="text-[13px] text-on-surface-variant/50 leading-relaxed max-w-xl">
            Put your skills to the test. Challenges simulate real-world scenarios, projects build your portfolio.
          </p>
        </header>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {OPERATIONS.map((op, i) => {
            const Icon = op.icon;
            const staggerDelay = i * 100;

            const cardInner = (
              <div
                className="relative overflow-hidden rounded-2xl border backdrop-blur-2xl transition-all duration-500 hover:scale-[1.01] h-full"
                style={{
                  background: '#050507',
                  borderColor: `rgba(${op.accentRgb},0.15)`,
                  boxShadow: `0 0 30px rgba(${op.accentRgb},0.04)`,
                }}
              >
                {/* Top accent gradient */}
                <div className="absolute top-0 inset-x-0 h-[2px]" style={{
                  background: `linear-gradient(90deg, transparent 5%, rgba(${op.accentRgb},0.8), transparent 95%)`,
                }} />

                {/* Ambient glow */}
                <div className="absolute inset-0 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" style={{
                  background: `radial-gradient(ellipse at top left, rgba(${op.accentRgb},0.08), transparent 50%)`,
                }} />

                <div className="relative p-8">
                  {/* Eyebrow */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `rgba(${op.accentRgb},0.2)`, boxShadow: `0 0 12px rgba(${op.accentRgb},0.15)` }}>
                      <Icon className="h-4 w-4" style={{ color: `rgb(${op.accentRgb})` }} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: `rgb(${op.accentRgb})` }}>
                      {op.eyebrow}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-3 group-hover:text-white transition-colors duration-300">
                    {op.title}
                  </h2>

                  {/* Description */}
                  <p className="text-[13px] leading-relaxed text-on-surface-variant/60 mb-6">
                    {op.description}
                  </p>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {op.stats.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ border: `1px solid rgba(${op.accentRgb},0.12)`, background: `rgba(${op.accentRgb},0.05)` }}>
                        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: `rgba(${op.accentRgb},0.5)` }}>{stat.label}</span>
                        <span className="text-[12px] font-bold text-white">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                      <Target className="h-3 w-3 shrink-0" style={{ color: `rgba(${op.accentRgb},0.7)` }} />
                      <span>{op.scenario}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/50">
                      <Cpu className="h-3 w-3 shrink-0" style={{ color: `rgba(${op.accentRgb},0.7)` }} />
                      <span>{op.tech}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div
                    className="rounded-[14px] py-3 px-4 flex items-center justify-between text-[12px] font-semibold"
                    style={{
                      background: `rgba(${op.accentRgb},0.08)`,
                      border: `1px solid rgba(${op.accentRgb},0.15)`,
                      color: `rgba(${op.accentRgb},0.5)`,
                    }}
                  >
                    <span>Coming soon</span>
                    <div className="relative h-1 w-12 overflow-hidden rounded-full" style={{ background: `rgba(${op.accentRgb},0.06)` }}>
                      <div className="absolute inset-y-0 left-0 w-1/3 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                        style={{ backgroundColor: `rgba(${op.accentRgb},0.15)` }} />
                    </div>
                  </div>
                </div>
              </div>
            );

            return (
              <div
                key={op.id}
                className="group block"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${staggerDelay + 100}ms forwards`,
                }}
              >
                {cardInner}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
