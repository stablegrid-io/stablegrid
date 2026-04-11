'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, Zap, Flame } from 'lucide-react';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';
import { useProgressStore } from '@/lib/stores/useProgressStore';

/* ── Types ── */
interface HomeDashboardProps {
  user: User;
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
}

/* ── Topic icon map ── */
const TOPIC_ICON: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  fabric: '/brand/microsoft-fabric-track.svg',
  airflow: '/brand/apache-airflow-logo.svg',
  sql: '/brand/sql-logo.svg',
  'python-de': '/brand/python-logo.svg',
  kafka: '/brand/apache-kafka-logo.svg',
  docker: '/brand/docker-logo.svg',
  dbt: '/brand/dbt-logo.svg',
  databricks: '/brand/databricks-logo.svg',
  'cloud-infra': '/brand/cloud-infra-logo.svg',
  flink: '/brand/apache-flink-logo.svg',
  iceberg: '/brand/apache-iceberg-logo.svg',
  terraform: '/brand/terraform-logo.svg',
  snowflake: '/brand/snowflake-logo.svg',
  'data-modeling': '/brand/data-modeling-logo.svg',
  'data-quality': '/brand/data-quality-logo.svg',
  governance: '/brand/governance-logo.svg',
  'git-cicd': '/brand/git-logo.svg',
  'spark-streaming': '/brand/spark-streaming-logo.svg',
};

/* ── Segmented progress bar (10 segments) ── */
const SegmentedBar = ({ pct, accentRgb }: { pct: number; accentRgb: string }) => {
  const filledCount = Math.round((pct / 100) * 10);
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: 10 }).map((_, i) => {
        const isFilled = i < filledCount;
        const opacity = isFilled ? 0.4 + (i / 10) * 0.6 : 1;
        return (
          <div
            key={i}
            className="h-[7px] flex-1 rounded-[1px] transition-all duration-700"
            style={{
              backgroundColor: isFilled ? `rgba(${accentRgb},${opacity})` : 'rgba(255,255,255,0.06)',
            }}
          />
        );
      })}
    </div>
  );
};

/* ── Main Dashboard ── */
export const HomeDashboard = ({
  user, topicProgress, recentSessions, completedSessions, latestTheorySession,
  lastClockedInAt: _lastClockedInAt, latestTaskAction: _latestTaskAction,
  readingSignals: _readingSignals, trackMetaByTopic: _trackMetaByTopic, stats,
  resumeContext,
}: HomeDashboardProps) => {

  /* ── User name ── */
  const userDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ?? 'Operator';
  const firstName = userDisplayName.split(' ')[0];

  /* ── Topic snapshots ── */
  const topicSnapshots = useMemo(() => {
    return HOME_TOPIC_ORDER.map((topicId) => {
      const progress = topicProgress.find((p) => p.topic === topicId);
      const meta = getHomeTopicMeta(topicId as Topic);
      const style = getTheoryTopicStyle(topicId);
      const theoryTotal = progress?.theoryChaptersTotal ?? 0;
      const theoryCompleted = progress?.theoryChaptersCompleted ?? 0;
      const theoryPct = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;
      return { topicId, label: meta?.label ?? topicId, theoryPct, theoryCompleted, theoryTotal, accentRgb: style.accentRgb };
    }).filter((s) => s.theoryTotal > 0);
  }, [topicProgress]);

  /* ── Current topic derivation ── */
  const latestSession = latestTheorySession ?? recentSessions[0] ?? null;
  const currentTopic = latestSession
    ? topicSnapshots.find((s) => s.topicId === latestSession.topic) ?? topicSnapshots[0]
    : topicSnapshots.find((s) => s.theoryPct > 0 && s.theoryPct < 100) ?? topicSnapshots[0];

  /* ── Resume href — deep link to exact lesson ── */
  const resumeHref = useMemo(() => {
    const ls = latestTheorySession ?? recentSessions[0] ?? null;
    if (!ls) return currentTopic ? `/learn/${currentTopic.topicId}/theory` : '/learn';
    const chId = ls.chapterId ?? '';
    const prefix = chId.replace(/\d+$/, '');
    const track = prefix.endsWith('S') ? 'senior' : prefix.endsWith('I') ? 'mid' : 'junior';
    const params = new URLSearchParams();
    params.set('chapter', chId);
    // Use the last read section as the current lesson
    const lastLesson = ls.sectionsIdsRead?.[ls.sectionsIdsRead.length - 1];
    if (lastLesson) params.set('lesson', lastLesson);
    return `/learn/${ls.topic}/theory/${track}?${params.toString()}`;
  }, [latestTheorySession, recentSessions, currentTopic]);

  /* ── Overall completion level ── */
  const overallPct = useMemo(() => {
    const total = topicSnapshots.reduce((s, t) => s + t.theoryTotal, 0);
    const done = topicSnapshots.reduce((s, t) => s + t.theoryCompleted, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [topicSnapshots]);

  /* ── Resume card topic ── */
  const resumeTopic = currentTopic ?? topicSnapshots[0];

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-8">

        {/* ── 1. Header with mascot slot ── */}
        <div
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 0ms forwards' }}
        >
          {/* Left: Mascot + greeting */}
          <div className="flex items-center gap-5">
            {/* Mascot slot */}
            <div
              className="relative w-20 h-20 shrink-0 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(153,247,255,0.08), rgba(191,129,255,0.08))',
                border: '2px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Placeholder — replace with actual mascot image */}
              <div className="w-14 h-14 rounded-full bg-white/[0.04] flex items-center justify-center">
                <span className="text-2xl font-black text-on-surface/20">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Level badge */}
              <div
                className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full font-mono text-[10px] font-bold"
                style={{
                  background: '#111416',
                  border: '2px solid rgba(153,247,255,0.3)',
                  color: 'rgba(153,247,255,0.85)',
                }}
              >
                {Math.max(1, Math.floor(overallPct / 10))}
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">
                {userDisplayName}
              </h1>
              {/* Title based on progress */}
              <p className="font-mono text-[11px] tracking-widest uppercase mt-1" style={{ color: 'rgba(153,247,255,0.5)' }}>
                {overallPct >= 80 ? 'Senior Engineer' : overallPct >= 40 ? 'Mid Engineer' : overallPct > 0 ? 'Junior Engineer' : 'Recruit'}
              </p>
              {/* XP progress bar */}
              <div className="flex items-center gap-2 mt-2">
                <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${overallPct}%`,
                      background: 'linear-gradient(90deg, rgb(153,247,255), rgb(191,129,255))',
                      boxShadow: overallPct > 0 ? '0 0 6px rgba(153,247,255,0.4)' : 'none',
                    }}
                  />
                </div>
                <span className="font-mono text-[9px] text-on-surface-variant/30">{overallPct}%</span>
              </div>
            </div>
          </div>

          {/* Right: Stat pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* XP pill */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(255,201,101,0.1)', border: '1px solid rgba(255,201,101,0.2)' }}
            >
              <Zap size={13} style={{ color: 'rgb(255,201,101)' }} />
              <span className="font-mono text-[11px] font-semibold" style={{ color: 'rgba(255,201,101,0.85)' }}>
                {stats.totalXp.toLocaleString()}
              </span>
            </div>
            {/* Streak pill */}
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{ backgroundColor: 'rgba(255,113,108,0.1)', border: '1px solid rgba(255,113,108,0.2)' }}
            >
              <Flame size={13} style={{ color: 'rgb(255,113,108)' }} />
              <span className="font-mono text-[11px] font-semibold" style={{ color: 'rgba(255,113,108,0.85)' }}>
                {stats.currentStreak} days
              </span>
            </div>
          </div>
        </div>

        {/* ── 2. Resume card ── */}
        <div style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 100ms forwards' }}>
          {resumeTopic ? (
            <Link href={resumeHref} className="group block">
              <div
                className="relative p-7 flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
                style={{
                  background: '#111416',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '22px',
                }}
              >
                {/* Eyebrow + icon */}
                <div className="flex items-start justify-between mb-4">
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: '#99f7ff' }}>
                    {latestSession && resumeContext ? 'Continue' : 'Start'}
                  </span>
                  <Image
                    src={TOPIC_ICON[resumeTopic.topicId] ?? '/brand/pyspark-track-star.svg'}
                    alt={resumeTopic.label}
                    width={20}
                    height={20}
                    className="opacity-40"
                  />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold tracking-tight text-on-surface mb-2">
                  {latestSession && resumeContext ? resumeContext.chapterTitle : resumeTopic.label}
                </h3>

                {/* Description */}
                <p className="text-[12px] leading-relaxed text-on-surface-variant/40 mb-5 line-clamp-2">
                  {latestSession && resumeContext && resumeContext.lessonTitle
                    ? `${resumeTopic.label} · ${resumeContext.lessonTitle} · Lesson ${latestSession.sectionsRead}/${latestSession.sectionsTotal}`
                    : `Begin your ${resumeTopic.label} journey — ${resumeTopic.theoryTotal} modules available`
                  }
                </p>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-on-surface-variant/35 tracking-wide">Module Progress</span>
                    <span className="font-mono text-[13px] font-bold" style={{ color: '#99f7ff' }}>{resumeTopic.theoryPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${resumeTopic.theoryPct}%`,
                        backgroundColor: '#99f7ff',
                        boxShadow: resumeTopic.theoryPct > 0 ? '0 0 8px rgba(153,247,255,0.5)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <div
                  className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300"
                  style={{
                    backgroundColor: '#99f7ff',
                    color: '#0c0e10',
                    borderRadius: '14px',
                    boxShadow: '0 0 20px rgba(153,247,255,0.3), 0 0 50px rgba(153,247,255,0.12)',
                  }}
                >
                  {latestSession && resumeContext ? 'Resume Theory' : 'Begin Theory'}
                </div>
              </div>
            </Link>
          ) : (
            <Link
              href="/learn"
              className="group block rounded-[22px] bg-[#111416] border border-white/[0.06] p-8 text-center transition-all duration-300 hover:border-white/[0.12]"
            >
              <p className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant/35">No active sessions</p>
              <p className="mt-2 text-xl font-semibold text-on-surface/90">Start your first track</p>
              <div className="mt-5 inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(240,240,243,0.15)]"
                style={{ backgroundColor: '#f0f0f3', color: '#0a0c0e' }}
              >
                Browse tracks
                <ArrowRight size={14} strokeWidth={2.5} />
              </div>
            </Link>
          )}
        </div>


      </div>

      {/* ── Global keyframes ── */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
