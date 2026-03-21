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
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        {/* Hero section — XP, Level, Role */}
        <section className="mb-12 flex flex-col items-center justify-center py-20 border border-primary/10 glass-panel relative overflow-hidden bg-gradient-to-b from-surface-container-low to-background">
          <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
            {/* Decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[500px] h-[500px] border border-primary/5 rounded-full absolute" />
              <div className="w-[350px] h-[350px] border border-primary/10 rounded-full absolute border-dashed" />
              <div className="w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full absolute" />
            </div>

            <div className="relative flex items-center justify-center w-full min-h-[300px]">
              {/* Central node */}
              <div className="relative z-10 w-64 h-64 flex items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute w-24 h-24 border-2 border-primary rotate-[30deg] opacity-80 shadow-[0_0_20px_#00F2FF]" />
                  <div className="absolute w-24 h-24 border-2 border-primary/50 rotate-[-30deg]" />
                  <div className="absolute w-12 h-12 bg-primary/20 backdrop-blur-sm border border-primary animate-pulse" />
                  <div className="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent rotate-45" />
                  <div className="absolute w-[200px] h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent -rotate-45" />
                  <div className="absolute h-[200px] w-[1px] bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
                  <div className="absolute -top-12 -left-12 w-3 h-3 bg-primary neural-node" />
                  <div className="absolute -bottom-8 -right-16 w-2 h-2 bg-primary/80 neural-node" />
                  <div className="absolute top-16 -right-12 w-3 h-3 bg-primary neural-node" />
                </div>

                {/* XP display */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="text-[9px] font-mono text-primary/60 tracking-[0.4em] uppercase mb-1">XP_SYNC</div>
                  <div className="text-3xl font-headline font-black text-primary drop-shadow-[0_0_10px_rgba(0,242,255,0.5)]">
                    {stats.totalXp.toLocaleString()}
                  </div>
                </div>

                {/* Left stat — Streak */}
                <div className="absolute top-1/2 -left-48 -translate-y-1/2 text-right hidden lg:block">
                  <div className="border-r border-primary/30 pr-4 py-2">
                    <div className="text-[9px] font-mono text-primary/50 tracking-widest uppercase">Streak</div>
                    <div className="text-xl font-headline font-bold text-on-surface">
                      {stats.currentStreak} days
                    </div>
                  </div>
                </div>

                {/* Right stat — Progress */}
                <div className="absolute top-1/2 -right-48 -translate-y-1/2 text-left hidden lg:block">
                  <div className="border-l border-primary/30 pl-4 py-2">
                    <div className="text-[9px] font-mono text-primary/50 tracking-widest uppercase">Progress</div>
                    <div className="text-xl font-headline font-bold text-primary">
                      {overallProgress}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented progress bar */}
          <div className="max-w-xl mx-auto w-full mt-12 px-8 relative z-10">
            <div className="flex gap-1.5 h-1.5">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < Math.round((overallProgress / 100) * 12) ? 'bg-primary' : 'bg-white/5'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-4 font-mono text-[9px] text-primary/40 uppercase tracking-widest">
              <span>{firstName}&apos;s progress</span>
              <span>{stats.totalXp.toLocaleString()} XP total</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </section>

        {/* Theory + Assignments cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theory card */}
          <Link
            href={theoryAction.href}
            className="glass-panel border border-primary/10 p-8 flex flex-col h-full group relative overflow-hidden transition-all hover:border-primary/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_5px_#99f7ff]" />
              <span className="font-mono text-[10px] text-primary/60 tracking-widest uppercase">
                Theory
              </span>
            </div>

            <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">
              {theoryTrackLabel}
            </h3>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed max-w-md">
              {theoryAction.progressLine}
            </p>

            <div className="mt-auto">
              <div className="flex justify-between items-end mb-3">
                <span className="font-mono text-[10px] text-primary">
                  Progress: {theoryProgressPct}%
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  {theoryProgressValueLabel}
                </span>
              </div>
              <div className="h-1 w-full bg-surface-container-highest mb-8">
                <div
                  className="h-full bg-primary shadow-[0_0_10px_rgba(153,247,255,0.3)] transition-all duration-500"
                  style={{ width: `${theoryProgressPct}%` }}
                />
              </div>
              <div className="w-full bg-primary-container text-on-primary-container font-headline font-bold text-xs py-4 tracking-widest flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-[0.98] duration-150 uppercase border border-primary/20">
                <span>{theoryAction.label}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>

          {/* Assignments card */}
          <Link
            href={latestTaskAction.actionHref}
            className="glass-panel border border-tertiary/10 p-8 flex flex-col h-full group relative overflow-hidden transition-all hover:border-tertiary/30"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-1.5 bg-tertiary shadow-[0_0_5px_#ffc965]" />
              <span className="font-mono text-[10px] text-tertiary/60 tracking-widest uppercase">
                Assignments
              </span>
            </div>

            <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">
              {latestTaskAction.title}
            </h3>
            <p className="text-on-surface-variant text-sm mb-8 leading-relaxed max-w-md">
              {latestTaskAction.summary}
            </p>

            <div className="mt-auto">
              {tasksProgressPct !== null ? (
                <>
                  <div className="flex justify-between items-end mb-3">
                    <span className="font-mono text-[10px] text-tertiary">
                      Progress: {tasksProgressPct}%
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      {latestTaskAction.statLine}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-surface-container-highest mb-8">
                    <div
                      className="h-full bg-tertiary shadow-[0_0_10px_rgba(255,201,101,0.3)] transition-all duration-500"
                      style={{ width: `${tasksProgressPct}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="font-mono text-[10px] text-on-surface-variant mb-8">
                  {latestTaskAction.statLine}
                </p>
              )}
              <div className="w-full border border-tertiary/20 text-tertiary font-headline font-bold text-xs py-4 tracking-widest flex items-center justify-center gap-2 hover:bg-tertiary/5 transition-all active:scale-[0.98] duration-150 uppercase">
                <span>{latestTaskAction.actionLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
