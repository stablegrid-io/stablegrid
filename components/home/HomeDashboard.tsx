'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';

interface HomeDashboardProps {
  user: User;
  displayName: string | null;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
  completedSessions: ReadingSession[];
  latestTheorySession: ReadingSession | null;
  lastClockedInAt: string | null;
  latestTaskAction: {
    title: string; summary: string; statLine: string;
    actionLabel: string; actionHref: string; topicId: Topic;
    accentRgb?: string; progressPct?: number;
  };
  readingSignals: ReadingSignal[];
  trackMetaByTopic: TrackMetaByTopic;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number; overallAccuracy: number };
  resumeContext?: { chapterTitle: string; lessonTitle: string } | null;
  learnHref: string;
  learnLabel: string;
  practiceHref: string;
  practiceLabel: string;
  gridHint: { componentName: string; costKwh: number } | null;
}

const formatRelativeTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return '—';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ActivityRow {
  key: string;
  icon: string;
  label: string;
  timestamp: string | null;
  highlight?: boolean;
}

const CellIllustration = () => (
  <div className="grid grid-cols-4 grid-rows-4 border-t border-l border-on-surface w-[96px] h-[96px] shrink-0">
    <div className="border-b border-r border-on-surface bg-on-surface" />
    <div className="border-b border-r border-on-surface bg-on-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-primary flex items-center justify-center">
      <span className="material-symbols-outlined text-[16px] text-on-primary">brightness_5</span>
    </div>
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
    <div className="border-b border-r border-on-surface bg-surface" />
  </div>
);

const GenerationChart = ({ todayGain }: { todayGain: number | null }) => (
  <section className="border border-on-surface bg-surface p-8 flex flex-col">
    <div className="flex justify-between items-center mb-8 border-b border-surface-dim pb-2">
      <h3 className="font-ui-label text-on-surface uppercase tracking-wider text-[12px]">
        GENERATION TODAY
      </h3>
      {todayGain !== null && (
        <span className="font-data-mono text-primary text-[13px] tabular-nums">
          +{todayGain.toFixed(1)} kWh
        </span>
      )}
    </div>
    <div className="flex-1 relative min-h-[200px] border border-surface-dim bg-grid-pattern">
      <div className="absolute -left-5 top-0 font-data-mono text-[10px] text-on-surface-variant">Max</div>
      <div className="absolute -left-4 bottom-0 font-data-mono text-[10px] text-on-surface-variant">0</div>
      <div className="absolute -bottom-6 left-0 font-data-mono text-[10px] text-on-surface-variant">06:00</div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-data-mono text-[10px] text-on-surface-variant">12:00</div>
      <div className="absolute -bottom-6 right-0 font-data-mono text-[10px] text-on-surface-variant">18:00</div>
      <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
        <path d="M 0 100 Q 25 100 50 20 T 100 100" fill="rgba(203, 74, 7, 0.1)" stroke="#a33800" strokeWidth="1" />
        <ellipse cx="20" cy="85" fill="#1c1c16" rx="2" ry="1.5" />
        <ellipse cx="35" cy="50" fill="#1c1c16" rx="2" ry="1.5" />
        <ellipse cx="50" cy="20" fill="#1c1c16" rx="2" ry="1.5" />
        <ellipse cx="65" cy="50" fill="#1c1c16" rx="2" ry="1.5" />
        <ellipse cx="80" cy="85" fill="#1c1c16" rx="2" ry="1.5" />
      </svg>
    </div>
  </section>
);

export const HomeDashboard = ({
  user,
  displayName,
  topicProgress: _topicProgress,
  recentSessions: _recentSessions,
  completedSessions,
  latestTheorySession,
  lastClockedInAt,
  latestTaskAction: _latestTaskAction,
  readingSignals: _readingSignals,
  trackMetaByTopic: _trackMetaByTopic,
  stats,
  resumeContext,
  learnHref,
  learnLabel,
  practiceHref: _practiceHref,
  practiceLabel: _practiceLabel,
  gridHint,
}: HomeDashboardProps) => {
  const firstName = (
    displayName ??
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator'
  ).split(' ')[0];

  const nextUp = useMemo(() => {
    if (latestTheorySession && resumeContext?.chapterTitle) {
      return {
        moduleNumber: latestTheorySession.chapterNumber
          ? `Module ${latestTheorySession.chapterNumber}`
          : latestTheorySession.chapterId.replace(/^module-/i, 'Module '),
        title: resumeContext.lessonTitle || resumeContext.chapterTitle,
        summary: resumeContext.lessonTitle
          ? `Continue ${resumeContext.chapterTitle}.`
          : 'Pick up where you left off.',
        ctaLabel: 'Resume Lesson',
      };
    }
    return {
      moduleNumber: 'Module 1.1',
      title: 'PySpark — Your first DataFrame',
      summary:
        'Start with the building block. Read a CSV, inspect its schema, run your first transformation.',
      ctaLabel: 'Begin first lesson',
    };
  }, [latestTheorySession, resumeContext]);

  const activityRows = useMemo<ActivityRow[]>(() => {
    const rows: ActivityRow[] = [];
    if (stats.currentStreak >= 7) {
      rows.push({
        key: 'streak',
        icon: 'bolt',
        label: `${stats.currentStreak} day streak achieved`,
        timestamp: lastClockedInAt,
        highlight: true,
      });
    }
    if (stats.totalXp >= 10000 && stats.totalXp < 30000) {
      rows.push({ key: 'tier-mid', icon: 'emoji_events', label: 'Mid tier reached', timestamp: lastClockedInAt, highlight: true });
    } else if (stats.totalXp >= 30000) {
      rows.push({ key: 'tier-senior', icon: 'emoji_events', label: 'Senior tier reached', timestamp: lastClockedInAt, highlight: true });
    }
    completedSessions.slice(0, 4).forEach((session) => {
      rows.push({
        key: `lesson-${session.id}`,
        icon: 'check_circle',
        label: `Completed ${session.chapterId.replace(/^module-/i, 'Module ')}`,
        timestamp: session.completedAt ?? session.lastActiveAt,
      });
    });
    if (rows.length === 0) {
      rows.push({ key: 'welcome', icon: 'login', label: `Welcome to StableGrid, ${firstName}`, timestamp: lastClockedInAt });
    }
    return rows.slice(0, 5);
  }, [completedSessions, stats.currentStreak, stats.totalXp, lastClockedInAt, firstName]);

  const todayGain = useMemo<number | null>(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const todayCompletions = completedSessions.filter((s) => {
      const ts = s.completedAt ? Date.parse(s.completedAt) : NaN;
      return Number.isFinite(ts) && ts >= cutoff;
    }).length;
    if (todayCompletions === 0) return null;
    return todayCompletions * 50;
  }, [completedSessions]);

  return (
    <main className="bg-surface bg-grid-pattern min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1440px] mx-auto px-12 py-12 flex flex-col gap-12">
        <header className="border-b border-on-surface pb-6">
          <h1 className="font-h1 text-h1 text-on-surface">
            Welcome back, {firstName}.
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="border border-on-surface bg-surface p-8 relative flex flex-col">
            <div className="absolute top-0 right-0 border-l border-b border-on-surface px-2 py-1 font-ui-label text-[10px] text-on-surface uppercase tracking-wider bg-surface">
              NEXTUP
            </div>
            <div className="flex gap-6 mt-2">
              <CellIllustration />
              <div className="flex flex-col">
                <div className="font-data-mono text-on-surface-variant text-[13px] mb-1">
                  {nextUp.moduleNumber}
                </div>
                <h2 className="font-h2 text-h2 text-on-surface leading-tight mb-4">
                  {nextUp.title}
                </h2>
                <p className="font-body-lg text-on-surface-variant mb-6 leading-relaxed">
                  {nextUp.summary}
                </p>
                <Link
                  href={learnHref}
                  className="bg-primary text-on-primary font-ui-label uppercase tracking-wider text-[14px] px-6 py-3 self-start hover:bg-surface-tint transition-colors"
                >
                  {nextUp.ctaLabel === 'Resume Lesson' && learnLabel.startsWith('Continue')
                    ? 'Resume Lesson'
                    : learnLabel}
                </Link>
              </div>
            </div>
          </section>

          <GenerationChart todayGain={todayGain} />
        </div>

        <section className="border border-on-surface bg-surface">
          <div className="border-b border-on-surface p-4 bg-surface-container-low">
            <h3 className="font-ui-label text-on-surface uppercase tracking-wider text-[12px]">
              RECENT ACTIVITY LOG
            </h3>
          </div>
          <div className="flex flex-col w-full">
            {activityRows.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between p-4 border-b border-surface-dim last:border-b-0 hover:bg-surface-container-lowest transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 flex items-center justify-center ${
                      row.highlight
                        ? 'border border-on-surface bg-primary-fixed'
                        : 'border border-surface-dim'
                    }`}
                  >
                    <span className={`material-symbols-outlined text-[16px] ${row.highlight ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {row.icon}
                    </span>
                  </div>
                  <span className="font-body-lg text-on-surface text-[16px]">
                    {row.label}
                  </span>
                </div>
                <span className="font-data-mono text-on-surface-variant text-[13px] text-right tabular-nums">
                  {formatRelativeTime(row.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {gridHint && (
          <div className="flex items-center justify-between border-t border-surface-dim pt-4">
            <span className="font-body-lg text-on-surface-variant">
              You have enough power to deploy{' '}
              <span className="text-on-surface font-semibold">{gridHint.componentName}</span>.
            </span>
            <Link
              href="/grid"
              className="font-ui-label uppercase tracking-wider text-[12px] text-primary border-b-2 border-primary hover:text-surface-tint hover:border-surface-tint pb-1"
            >
              Open Grid →
            </Link>
          </div>
        )}

        <footer className="mt-8 border-t border-on-surface pt-6 pb-12 flex justify-between items-center">
          <div className="font-ui-label text-on-surface font-bold text-[14px] uppercase tracking-widest">
            StableGrid
          </div>
          <div className="flex gap-6 font-data-mono text-on-surface-variant text-[13px]">
            <Link href="/support" className="hover:text-primary transition-colors">Support</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          </div>
        </footer>
      </div>
    </main>
  );
};
