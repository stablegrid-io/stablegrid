'use client';

import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import { getLearnTopicMeta } from '@/data/learn';
import { useTheoryModuleProgressSnapshots } from '@/lib/hooks/useTheoryModuleProgressSnapshots';
import { summarizeTrackLessonProgress } from '@/lib/learn/theoryTrackProgress';
import type { TheoryDoc } from '@/types/theory';
import type { TheoryTrackSummary } from '@/data/learn/theory/tracks';
import type {
  ServerTheoryChapterProgressSnapshot,
  ServerTheoryModuleProgressSnapshot
} from '@/lib/learn/serverTheoryProgress';

interface TheoryTrackGalleryProps {
  doc: TheoryDoc;
  tracks: TheoryTrackSummary[];
  completedChapterIds: string[];
  chapterProgressById?: Record<string, ServerTheoryChapterProgressSnapshot>;
  moduleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}

/* ── Per-tier visual config ─────────────────────────────────────────────────── */

const TIER = [
  {
    color: '#99f7ff', rgb: '153,247,255',
    label: 'JUNIOR', subtitle: 'FOUNDATIONAL MODULES',
    xp: '1.0X', cta: 'Start Learning',
    image: '/brand/track-junior.png',
    imageFilter: '',
    imageHue: '',
    ctaStyle: 'filled' as const,
  },
  {
    color: '#ffc965', rgb: '255,201,101',
    label: 'MID', subtitle: 'ADVANCED SYSTEMS',
    xp: '1.5X', cta: 'Start Learning',
    image: '/brand/track-mid.png',
    imageFilter: '',
    imageHue: '',
    ctaStyle: 'outlined' as const,
  },
  {
    color: '#ff716c', rgb: '255,113,108',
    label: 'SENIOR', subtitle: 'PLATFORM ARCHITECTURE',
    xp: '3.0X', cta: 'Locked',
    image: '/brand/track-senior.png',
    imageFilter: '',
    imageHue: '',
    ctaStyle: 'outlined' as const,
  },
];

/* ── Status log ticker ──────────────────────────────────────────────────────── */

const LOG = [
  'Tracks loaded',
  'Modules synced',
  'Auth verified',
  'Progress stream active',
  'Cache ready',
  'Session available',
];

/* ── Gallery ────────────────────────────────────────────────────────────────── */

export const TheoryTrackGallery = ({
  doc, tracks, completedChapterIds,
  chapterProgressById = {}, moduleProgressById = {},
}: TheoryTrackGalleryProps) => {
  const {
    completedChapterIds: liveCompleted,
    moduleProgressById: liveMod,
  } = useTheoryModuleProgressSnapshots({
    topic: doc.topic,
    initialCompletedChapterIds: completedChapterIds,
    initialModuleProgressById: moduleProgressById,
  });

  const topicStyle = getTheoryTopicStyle(doc.topic);

  return (
    <div className="relative min-h-screen pb-24 lg:pb-10" style={{ '--theory-accent': topicStyle.accentRgb } as CSSProperties}>
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">

        {/* Back */}
        <Link
          href="/learn"
          className="mb-8 inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Learn Hub
        </Link>

        {/* Title block */}
        <header className="mb-10">
          <h1
            className="font-black text-5xl lg:text-[4rem] tracking-tighter uppercase text-on-surface mb-2"
            style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}
          >
            {getLearnTopicMeta(doc.topic)?.title ?? doc.topic.replace(/-/g, ' ')}
          </h1>
        </header>

        {/* 3-column tier grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {(() => {
            const trackStats = tracks.map((track) =>
              summarizeTrackLessonProgress({
                chapters: track.chapters,
                completedChapterIds: liveCompleted,
                chapterProgressById,
              }),
            );
            return tracks.map((track, i) => {
            const tier = TIER[i] ?? TIER[0];
            const { completedModules, progressPct } = trackStats[i];
            const prevIncomplete = i > 0 && (trackStats[i - 1]?.progressPct ?? 0) < 100;
            const isLocked = track.chapterCount === 0 || prevIncomplete;
            const isStarted = progressPct > 0;
            const isComplete = progressPct >= 100;
            const segments = 10;
            const filled = Math.round((progressPct / 100) * segments);
            const totalMin = track.totalMinutes ?? 0;
            const h = Math.floor(totalMin / 60);
            const m = totalMin % 60;
            const est = isLocked ? '-- : -- : --' : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
            const cta = isLocked ? tier.cta : isComplete ? 'Review Track' : isStarted ? 'Continue' : tier.cta;

            return (
              <Link
                key={track.slug}
                href={isLocked ? '#' : `/learn/${doc.topic}/theory/${track.slug}`}
                className={`group block ${isLocked ? 'pointer-events-none' : ''}`}
                style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${i * 80 + 120}ms forwards` }}
              >
                <div
                  className="relative overflow-hidden h-full flex flex-col transition-all duration-500 hover:scale-[1.015] rounded-[22px]"
                  style={{
                    background: '#181c20',
                    border: `1px solid ${isLocked ? 'rgba(255,255,255,0.05)' : `rgba(${tier.rgb},0.12)`}`,
                  }}
                >
                  {/* ── L-bracket corners ── */}
                  <Corner pos="top-left" rgb={tier.rgb} locked={isLocked} />
                  <Corner pos="bottom-right" rgb={tier.rgb} locked={isLocked} />

                  {/* ── Banner image ── */}
                  <div className="relative h-44 overflow-hidden shrink-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{
                        backgroundImage: `url(${tier.image})`,
                        filter: isLocked ? 'brightness(0.15) saturate(0)' : `${tier.imageFilter} ${tier.imageHue}`,
                      }}
                    />
                    {/* bottom gradient */}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, #181c20 95%)' }} />

                    {/* Lock overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-12 w-12 text-white/[0.07]" />
                      </div>
                    )}
                  </div>

                  {/* ── Card body ── */}
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
                      <StatRow label="MODULES" value={`${String(completedModules).padStart(2, '0')} / ${String(track.chapterCount).padStart(2, '0')}`} />
                      <StatRow label="Est. Completion" value={est} />
                      <StatRow label="kWh Multiplier" value={tier.xp} />
                    </div>

                    {/* CTA */}
                    <div className="mt-6">
                      {isLocked ? (
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
              </Link>
            );
          });
          })()}
        </div>

        {/* ── Bottom status ticker ── */}
      </div>
    </div>
  );
};

/* ── Stat Row ───────────────────────────────────────────────────────────────── */

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

/* ── Corner brackets ────────────────────────────────────────────────────────── */

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

/* ── Status ticker ──────────────────────────────────────────────────────────── */

function Ticker() {
  const [ts, setTs] = useState('');

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTs(`[LOG_${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}]`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const msg = LOG.map((m) => `${m}...`).join('   ');

  return (
    <div
      className="mt-8 flex items-center gap-4 px-4 py-2.5 overflow-hidden font-mono text-[10px] tracking-widest text-on-surface-variant/25 uppercase"
      style={{
        border: '1px solid rgba(255,255,255,0.03)',
        background: 'rgba(255,255,255,0.01)',
        opacity: 0,
        animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 500ms forwards',
      }}
    >
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400/50">Connected</span>
      </div>
      <div className="flex-1 overflow-hidden whitespace-nowrap">
        <div className="inline-block animate-[scroll_30s_linear_infinite]">
          <span>{ts}: {msg}</span>
          <span className="ml-16">{ts}: {msg}</span>
        </div>
      </div>
      <div className="shrink-0 hidden sm:block text-on-surface-variant/15">
        stableGrid v4.2
      </div>
    </div>
  );
}
