'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight } from 'lucide-react';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import {
  getAvailableBudgetUnits,
  INFRASTRUCTURE_NODES
} from '@/lib/energy';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';

interface HomeDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
  latestTheorySession: ReadingSession | null;
  lastClockedInAt: string | null;
  latestTaskAction: {
    title: string;
    summary: string;
    statLine: string;
    actionLabel: string;
    actionHref: string;
    topicId: Topic;
    accentRgb?: string;
    progressPct?: number;
  };
  readingSignals: ReadingSignal[];
  stats: {
    totalXp: number;
    currentStreak: number;
    questionsCompleted: number;
    overallAccuracy: number;
  };
}

interface TopicSnapshot {
  topicId: Topic;
  label: string;
  theoryPct: number;
  theoryCompleted: number;
  theoryTotal: number;
}

const ACTIVATION_TRACK_ACCENT_RGB_BY_TOPIC: Record<Topic, string> = {
  pyspark: '245,158,11',
  fabric: '34,185,153',
  airflow: '226,77,66'
};

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export const HomeDashboard = ({
  user,
  topicProgress,
  recentSessions,
  latestTheorySession,
  lastClockedInAt,
  latestTaskAction,
  readingSignals,
  stats
}: HomeDashboardProps) => {
  const deployedNodeIds = useProgressStore((state) => state.deployedNodeIds);

  const availableBudgetUnits = getAvailableBudgetUnits(stats.totalXp, deployedNodeIds);
  const nextGridNode =
    INFRASTRUCTURE_NODES.find((node) => !deployedNodeIds.includes(node.id)) ?? null;
  const remainingGridUnits = nextGridNode
    ? Math.max(0, Math.round(nextGridNode.kwhRequired * 1000) - availableBudgetUnits)
    : 0;

  const topicSnapshots = useMemo<TopicSnapshot[]>(() => {
    const progressMap = new Map(topicProgress.map((item) => [item.topic, item]));

    return HOME_TOPIC_ORDER.map((topicId) => {
      const progress = progressMap.get(topicId);
      const meta = getHomeTopicMeta(topicId);
      const theoryTotal =
        progress?.theoryChaptersTotal && progress.theoryChaptersTotal > 0
          ? progress.theoryChaptersTotal
          : meta.fallbackChapters;
      const theoryCompleted = progress?.theoryChaptersCompleted ?? 0;
      const theoryPct = theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;

      return {
        topicId,
        label: meta.label,
        theoryPct,
        theoryCompleted,
        theoryTotal
      };
    });
  }, [topicProgress]);

  const latestSession = latestTheorySession ?? recentSessions[0] ?? null;
  const recommendedTopic =
    (latestSession
      ? topicSnapshots.find((snapshot) => snapshot.topicId === latestSession.topic)
      : null) ??
    [...topicSnapshots]
      .sort((left, right) => left.theoryPct - right.theoryPct)
      .find((snapshot) => snapshot.theoryPct < 100) ??
    topicSnapshots[0];

  const overallProgress = useMemo(() => {
    const theoryTotal = topicSnapshots.reduce((sum, snapshot) => sum + snapshot.theoryTotal, 0);
    const theoryCompleted = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.theoryCompleted,
      0
    );
    return theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;
  }, [topicSnapshots]);

  const hasRecentActivity =
    stats.questionsCompleted > 0 || recentSessions.length > 0 || readingSignals.length > 0;
  const moduleTopicId = latestSession?.topic ?? recommendedTopic.topicId;
  const moduleMeta = getHomeTopicMeta(moduleTopicId);
  const moduleLabel = moduleMeta.label;
  const theoryTrackLabel = moduleMeta.trackLabel;
  const theoryAccentRgb = ACTIVATION_TRACK_ACCENT_RGB_BY_TOPIC[moduleTopicId];
  const theoryRouteHref = `/learn/${moduleTopicId}/theory`;
  const inferredChapterFromTrackProgress = Math.min(
    Math.max(1, recommendedTopic.theoryTotal),
    Math.max(1, recommendedTopic.theoryCompleted + 1)
  );
  const theoryResumeChapterNumber = latestSession
    ? latestSession.isCompleted
      ? Math.max(
          inferredChapterFromTrackProgress,
          Math.min(
            Math.max(1, recommendedTopic.theoryTotal),
            latestSession.chapterNumber + 1
          )
        )
      : Math.max(inferredChapterFromTrackProgress, latestSession.chapterNumber)
    : inferredChapterFromTrackProgress;
  const theoryChapterRouteHref = latestSession
    ? `/learn/${moduleTopicId}/theory/all?chapter=${encodeURIComponent(
        `module-${String(theoryResumeChapterNumber).padStart(2, '0')}`
      )}`
    : theoryRouteHref;
  const userDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Operator';
  const firstName = userDisplayName.split(' ')[0] ?? userDisplayName;
  const remainingSections = latestSession
    ? Math.max(0, latestSession.sectionsTotal - latestSession.sectionsRead)
    : 0;
  const theoryProgressPct = latestSession
    ? latestSession.sectionsTotal > 0
      ? clampPct((latestSession.sectionsRead / latestSession.sectionsTotal) * 100)
      : latestSession.isCompleted
        ? 100
        : 0
    : clampPct(recommendedTopic.theoryPct);
  const theoryProgressValueLabel = latestSession
    ? `${latestSession.sectionsRead}/${latestSession.sectionsTotal} sections`
    : `${recommendedTopic.theoryCompleted}/${recommendedTopic.theoryTotal} chapters`;
  const tasksProgressPct =
    typeof latestTaskAction.progressPct === 'number'
      ? clampPct(latestTaskAction.progressPct)
      : null;
  const theoryAction = (() => {
    if (latestSession) {
      if (latestSession.isCompleted) {
        return {
          label: 'Open latest chapter',
          href: theoryChapterRouteHref,
          progressLine: `Chapter ${latestSession.chapterNumber} completed most recently.`
        };
      }

      return {
        label: 'Resume chapter',
        href: theoryChapterRouteHref,
        progressLine:
          remainingSections > 0
            ? `${remainingSections} sections still open in this chapter.`
            : 'Final checkpoint remains in this chapter.'
      };
    }

    if (nextGridNode && remainingGridUnits === 0) {
      return {
        label: 'Open Grid Ops',
        href: '/energy',
        progressLine: `${nextGridNode.name} is unlocked and ready for deployment.`
      };
    }

    return {
      label: hasRecentActivity ? 'Open module' : 'Start module',
      href: theoryRouteHref,
      progressLine: `${recommendedTopic.theoryCompleted}/${recommendedTopic.theoryTotal} chapters complete.`
    };
  })();
  return (
    <div className="relative min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-4">

        {/* Top stats bar */}
        <div className="flex flex-wrap items-center gap-6 mb-6 border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-on-surface-variant uppercase">SYSTEM_LVL</span>
            <span className="font-headline text-2xl font-black text-on-surface">
              {Math.floor(stats.totalXp / 1000)}
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`w-1 h-4 ${i < Math.min(4, Math.floor(stats.totalXp / 2500)) ? 'bg-primary' : 'bg-surface-container-highest'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-on-surface-variant uppercase">XP_TOTAL</span>
            <span className="font-headline text-2xl font-black text-on-surface">
              {stats.totalXp.toLocaleString()}
            </span>
            <span className="font-mono text-sm text-on-surface-variant">/ {((Math.floor(stats.totalXp / 10000) + 1) * 10000).toLocaleString()}</span>
          </div>
          <div className="ml-auto hidden lg:flex items-center gap-6">
            <div>
              <span className="font-mono text-[8px] text-on-surface-variant uppercase block">CURRENT_TITLE</span>
              <span className="font-headline text-sm font-bold text-on-surface uppercase">{firstName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] text-on-surface-variant uppercase">STREAK_ACTIVE</span>
              <span className="font-headline text-sm font-bold text-primary">{stats.currentStreak}_DAYS</span>
            </div>
          </div>
        </div>

        {/* 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">

          {/* Left: Theory Tree */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider">THEORY_TREE</h2>
              <span className="font-mono text-[9px] text-on-surface-variant">[MOD: {recommendedTopic.theoryCompleted}/{recommendedTopic.theoryTotal}]</span>
            </div>

            {topicSnapshots.map((snapshot, index) => {
              const isActive = snapshot.topicId === moduleTopicId;
              const isCompleted = snapshot.theoryPct >= 100;
              const filledBars = Math.round((snapshot.theoryPct / 100) * 4);

              return (
                <Link
                  key={snapshot.topicId}
                  href={`/learn/${snapshot.topicId}/theory`}
                  className={`block border p-3 transition-all ${
                    isActive
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-outline-variant/15 hover:border-outline-variant/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-7 h-7 flex items-center justify-center border text-[10px] font-mono font-bold flex-shrink-0 ${
                      isCompleted
                        ? 'border-primary bg-primary/20 text-primary'
                        : isActive
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-outline-variant/30 text-on-surface-variant'
                    }`}>
                      {isCompleted ? '✓' : isActive ? '▶' : '○'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[9px] text-on-surface-variant">M-{String(index + 1).padStart(2, '0')}{isActive ? ' [ACTIVE]' : ''}</div>
                      <div className={`font-headline text-xs font-bold uppercase leading-tight ${isActive ? 'text-primary' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {snapshot.label}
                      </div>
                      {isCompleted && (
                        <span className="font-mono text-[8px] text-primary bg-primary/10 px-1.5 py-0.5 mt-1 inline-block">SYNCED</span>
                      )}
                      {!isCompleted && (
                        <div className="flex gap-0.5 mt-1.5">
                          {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className={`w-3 h-1 ${i < filledBars ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Center: Main content area */}
          <div className="space-y-6">
            {/* Theory resume card */}
            <Link
              href={theoryAction.href}
              className="glass-panel border border-primary/10 p-6 flex flex-col group relative overflow-hidden transition-all hover:border-primary/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_5px_#99f7ff]" />
                <span className="font-mono text-[10px] text-primary/60 tracking-widest uppercase">
                  ACTIVE_THEORY
                </span>
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
                {theoryTrackLabel}
              </h3>
              <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">
                {theoryAction.progressLine}
              </p>
              <div className="flex justify-between items-end mb-2">
                <span className="font-mono text-[10px] text-primary">PROGRESS: {theoryProgressPct}%</span>
                <span className="font-mono text-[10px] text-on-surface-variant">{theoryProgressValueLabel}</span>
              </div>
              <div className="h-1 w-full bg-surface-container-highest mb-6">
                <div className="h-full bg-primary shadow-[0_0_10px_rgba(153,247,255,0.3)] transition-all" style={{ width: `${theoryProgressPct}%` }} />
              </div>
              <div className="w-full bg-primary text-on-primary font-headline font-bold text-xs py-3 tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(153,247,255,0.4)] active:scale-[0.98] transition-all uppercase">
                <span>{theoryAction.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>

            {/* Operations card */}
            <Link
              href={latestTaskAction.actionHref}
              className="glass-panel border border-tertiary/10 p-6 flex flex-col group relative overflow-hidden transition-all hover:border-tertiary/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-1.5 bg-tertiary shadow-[0_0_5px_#ffc965]" />
                <span className="font-mono text-[10px] text-tertiary/60 tracking-widest uppercase">
                  ACTIVE_OPERATION
                </span>
              </div>
              <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
                {latestTaskAction.title}
              </h3>
              <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">
                {latestTaskAction.summary}
              </p>
              {tasksProgressPct !== null && (
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={`flex-1 h-1.5 ${i < Math.round(tasksProgressPct / 10) ? 'bg-tertiary' : 'bg-surface-container-highest'}`} />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="text-on-surface-variant">{latestTaskAction.statLine}</span>
                <span className="text-tertiary font-bold">{latestTaskAction.actionLabel} &gt;&gt;</span>
              </div>
            </Link>
          </div>

          {/* Right: Mission briefing cards */}
          <div className="space-y-4">
            <h2 className="font-headline text-sm font-bold text-on-surface uppercase tracking-wider">
              MISSION_BRIEFING
            </h2>

            {/* Active assignment */}
            <div className="border border-outline-variant/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 bg-primary" />
                <span className="font-mono text-[8px] text-primary uppercase tracking-widest">ACTIVE_ASSIGNMENT</span>
              </div>
              <h4 className="font-headline text-xs font-bold text-on-surface uppercase mb-2">{theoryTrackLabel}</h4>
              <div className="flex gap-0.5 mb-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className={`w-3 h-1 ${i < Math.round((theoryProgressPct / 100) * 6) ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                ))}
              </div>
              <Link href={theoryAction.href} className="font-mono text-[9px] text-primary hover:underline uppercase tracking-wider">
                RESUME &gt;&gt;
              </Link>
            </div>

            {/* XP Stats */}
            <div className="border border-outline-variant/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 bg-secondary" />
                <span className="font-mono text-[8px] text-secondary uppercase tracking-widest">OPERATOR_STATS</span>
              </div>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">QUESTIONS</span>
                  <span className="text-on-surface font-bold">{stats.questionsCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">ACCURACY</span>
                  <span className="text-on-surface font-bold">{stats.overallAccuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">OVERALL</span>
                  <span className="text-primary font-bold">{overallProgress}%</span>
                </div>
              </div>
            </div>

            {/* Grid telemetry */}
            <div className="border border-outline-variant/20 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 bg-tertiary" />
                <span className="font-mono text-[8px] text-tertiary uppercase tracking-widest">GRID_TELEMETRY</span>
              </div>
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">TOPICS</span>
                  <span className="text-on-surface font-bold">{topicSnapshots.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">STREAK</span>
                  <span className="text-on-surface font-bold">{stats.currentStreak} DAYS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">NETWORK</span>
                  <span className="text-primary font-bold">ENCRYPTED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
