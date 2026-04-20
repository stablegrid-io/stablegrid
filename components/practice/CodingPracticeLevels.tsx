'use client';

import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

/* ── Per-tier visual config (matches TheoryTrackGallery) ──────────────────── */

const TIER = [
  {
    slug: 'junior',
    color: '#99f7ff', rgb: '153,247,255',
    label: 'JUNIOR', subtitle: 'FOUNDATIONAL MODULES',
    xp: '1.0X',
    image: '/brand/track-junior.png',
    imageFilter: 'brightness(0.45) contrast(1.1)',
    imageHue: 'hue-rotate(160deg) saturate(0.6)',
    questionCount: 0,
    locked: false,
    comingSoon: false,
  },
  {
    slug: 'mid',
    color: '#ffc965', rgb: '255,201,101',
    label: 'MID', subtitle: 'ADVANCED SYSTEMS',
    xp: '1.5X',
    image: '/brand/track-mid.png',
    imageFilter: 'brightness(0.45) contrast(1.1)',
    imageHue: '',
    questionCount: 0,
    locked: false,
    comingSoon: true,
  },
  {
    slug: 'senior',
    color: '#ff716c', rgb: '255,113,108',
    label: 'SENIOR', subtitle: 'PLATFORM ARCHITECTURE',
    xp: '3.0X',
    image: '/brand/track-senior.png',
    imageFilter: 'brightness(0.3) saturate(0) contrast(1.1)',
    imageHue: '',
    questionCount: 0,
    locked: true,
    comingSoon: true,
  },
];

/* ── Corner brackets ──────────────────────────────────────────────────────── */

function Corner({ pos, rgb, locked }: { pos: 'top-left' | 'bottom-right'; rgb: string; locked: boolean }) {
  const c = locked ? 'rgba(255,255,255,0.04)' : `rgba(${rgb},0.25)`;
  if (pos === 'top-left') {
    return (
      <div className="absolute top-0 left-0 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-4 h-[1px]" style={{ backgroundColor: c }} />
        <div className="absolute top-0 left-0 w-[1px] h-4" style={{ backgroundColor: c }} />
      </div>
    );
  }
  return (
    <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
      <div className="absolute bottom-0 right-0 w-4 h-[1px]" style={{ backgroundColor: c }} />
      <div className="absolute bottom-0 right-0 w-[1px] h-4" style={{ backgroundColor: c }} />
    </div>
  );
}

/* ── Stat Row ─────────────────────────────────────────────────────────────── */

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
    >
      <span className="font-mono text-[10px] tracking-widest text-on-surface-variant/35 uppercase">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-on-surface/80">{value}</span>
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────────────────── */

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  sql: 'SQL',
  pyspark: 'PySpark',
};

export function CodingPracticeLevels({ language = 'python' }: { language?: string }) {
  const langLabel = LANGUAGE_LABELS[language] ?? language;

  return (
    <div className="relative min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Back */}
        <Link
          href="/practice/coding"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Coding
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1
            className="font-black text-5xl lg:text-[4rem] tracking-tighter uppercase text-on-surface mb-2"
            style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}
          >
            {langLabel}
          </h1>
        </header>

        {/* 3-column tier grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {TIER.map((tier, i) => {
            const isLocked = tier.locked;
            const progressPct = 0;
            const completedModules = 0;
            const totalModules = tier.questionCount;
            const cta = tier.comingSoon
              ? 'Under Construction'
              : isLocked
                ? 'Locked'
                : 'Start';

            const isClickable = !tier.comingSoon && !isLocked;
            const Wrapper = isClickable ? Link : 'div';
            const wrapperProps = isClickable ? { href: `/practice/coding/${language}/${tier.slug}` } : {};

            return (
              <Wrapper
                key={tier.slug}
                {...(wrapperProps as any)}
                className={`group block ${isLocked ? 'pointer-events-none' : ''}`}
                style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80 + 120}ms forwards` }}
              >
                <div
                  className="relative overflow-hidden h-full flex flex-col transition-all duration-500 hover:scale-[1.015] rounded-[22px]"
                  style={{
                    background: '#111416',
                    border: `1px solid ${isLocked ? 'rgba(255,255,255,0.05)' : `rgba(${tier.rgb},0.12)`}`,
                  }}
                >
                  {/* L-bracket corners */}
                  <Corner pos="top-left" rgb={tier.rgb} locked={isLocked} />
                  <Corner pos="bottom-right" rgb={tier.rgb} locked={isLocked} />

                  {/* Banner image */}
                  <div className="relative h-44 overflow-hidden shrink-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${tier.image})`,
                        filter: isLocked ? 'brightness(0.15) saturate(0)' : `${tier.imageFilter} ${tier.imageHue}`,
                      }}
                    />
                    {/* bottom gradient */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, #111416 95%)' }} />

                    {/* Level pill */}
                    <div
                      className="absolute top-4 left-4 px-3 py-1 rounded-full font-mono text-[10px] font-bold tracking-widest"
                      style={{
                        backgroundColor: isLocked ? 'rgba(255,255,255,0.04)' : `rgba(${tier.rgb},0.18)`,
                        color: isLocked ? 'rgba(255,255,255,0.15)' : tier.color,
                      }}
                    >
                      LEVEL{String(i + 1).padStart(2, '0')}
                    </div>

                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-12 w-12 text-white/[0.07]" />
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className={`relative flex-1 flex flex-col px-6 pb-6 pt-2 ${isLocked ? 'opacity-35' : ''}`}>
                    {/* Title */}
                    <h2 className="text-[2.4rem] font-black tracking-tight text-on-surface leading-none mb-1">
                      {tier.label}
                    </h2>
                    <p
                      className="font-mono text-[10px] tracking-[0.18em] uppercase mb-8"
                      style={{ color: tier.color }}
                    >
                      {tier.subtitle}
                    </p>

                    {/* Progress */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] tracking-widest text-on-surface-variant/35 uppercase">Progress</span>
                      <span className="font-mono text-[13px] font-bold" style={{ color: tier.color }}>{progressPct}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-8 w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
                    </div>

                    {/* Stat rows */}
                    <div className="space-y-0 flex-1">
                      <StatRow label="Modules" value={`${String(completedModules).padStart(2, '0')} / ${String(totalModules).padStart(2, '0')}`} />
                      <StatRow label="Est. Completion" value={isLocked ? '-- : -- : --' : '00:00:00'} />
                      <StatRow label="XP Multiplier" value={tier.xp} />
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      {tier.comingSoon ? (
                        <div
                          className="w-full py-3.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] uppercase rounded-[14px] transition-all duration-300"
                          style={{
                            border: '1px dashed rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.2)',
                          }}
                        >
                          {cta}
                        </div>
                      ) : isLocked ? (
                        <div
                          className="w-full py-3.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] uppercase rounded-[14px] transition-all duration-300"
                          style={{
                            border: '1px solid rgba(255,255,255,0.06)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            color: 'rgba(255,255,255,0.12)',
                          }}
                        >
                          {cta}
                        </div>
                      ) : (
                        <div
                          className="w-full py-3.5 text-center font-mono text-[12px] font-bold tracking-[0.2em] uppercase rounded-[14px] transition-all duration-300"
                          style={{
                            border: '1px solid rgba(255,255,255,0.12)',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          {cta}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
