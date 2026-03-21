'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { ArrowRight, BookOpen, ClipboardCheck } from 'lucide-react';
import dynamic from 'next/dynamic';
import { HomeActivationTable } from '@/components/home/activation-table/HomeActivationTable';

const CharacterHeroCard = dynamic(
  () => import('@/components/progress/CharacterHeroCard').then((m) => m.CharacterHeroCard),
  { ssr: false }
);
import type { HomeActivationTableData } from '@/components/home/activation-table/types';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import {
  formatUnitsAsKwh,
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
  const dailyEnergy = useProgressStore((state) => state.dailyXP);
  const deployedNodeIds = useProgressStore((state) => state.deployedNodeIds);

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const studySessionsToday = useMemo(
    () =>
      recentSessions.filter(
        (session) => format(new Date(session.lastActiveAt), 'yyyy-MM-dd') === todayKey
      ).length,
    [recentSessions, todayKey]
  );

  const energyTodayUnits = dailyEnergy[todayKey] ?? 0;
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
  const tasksAccentRgb = latestTaskAction.accentRgb ?? '34,185,153';
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
  const lastClockedInLabel = useMemo(() => {
    if (!lastClockedInAt) return null;
    const clockedInDate = new Date(lastClockedInAt);
    if (Number.isNaN(clockedInDate.getTime())) {
      return null;
    }
    return `Last checkpoint: ${format(clockedInDate, 'yyyy-MM-dd HH:mm:ss')}`;
  }, [lastClockedInAt]);
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
  const gridUnlockProgressPct = (() => {
    if (!nextGridNode) {
      return 100;
    }
    const unlockRequiredUnits = Math.max(1, Math.round(nextGridNode.kwhRequired * 1000));
    return clampPct((Math.min(availableBudgetUnits, unlockRequiredUnits) / unlockRequiredUnits) * 100);
  })();

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
  const canDeployNextNode = Boolean(nextGridNode && remainingGridUnits === 0);

  const activationData: HomeActivationTableData = {
    greeting: {
      title: `Welcome back, ${firstName}`,
      subtitle: [
        latestSession ? `${moduleLabel} · Chapter ${latestSession.chapterNumber}` : `${moduleLabel} route`,
        `${overallProgress}% complete`,
        studySessionsToday > 0
          ? 'Active today'
          : stats.currentStreak > 0
            ? `${stats.currentStreak}-day momentum`
            : 'Momentum inactive'
      ].join(' · '),
      lastClockedIn: lastClockedInLabel ?? undefined
    },
    categories: [
      {
        kind: 'theory',
        label: 'Theory',
        title: theoryTrackLabel,
        summary: latestSession && !latestSession.isCompleted
          ? 'Resume the active chapter and keep continuity.'
          : latestSession && latestSession.isCompleted
            ? 'Continue from your latest completed chapter.'
          : 'Continue the clearest theory route to maintain momentum.',
        statLine: theoryAction.progressLine,
        accentRgb: theoryAccentRgb,
        progress: {
          valuePct: theoryProgressPct,
          label: latestSession ? 'Chapter progress' : 'Track progress',
          valueLabel: theoryProgressValueLabel
        },
        primaryAction: {
          label: theoryAction.label,
          href: theoryAction.href
        }
      },
      {
        kind: 'tasks',
        label: 'Tasks',
        title: latestTaskAction.title,
        summary: latestTaskAction.summary,
        statLine: latestTaskAction.statLine,
        accentRgb: tasksAccentRgb,
        progress:
          tasksProgressPct !== null
            ? {
                valuePct: tasksProgressPct,
                label: 'Task progress'
              }
            : undefined,
        primaryAction: {
          label: latestTaskAction.actionLabel,
          href: latestTaskAction.actionHref
        }
      },
      {
        kind: 'grid',
        label: 'Grid',
        title: nextGridNode ? nextGridNode.name : 'Grid Ops',
        summary: nextGridNode
          ? remainingGridUnits === 0
            ? 'Unlock threshold reached. Deploy this node to stabilize your grid.'
            : `${formatUnitsAsKwh(remainingGridUnits)} still needed to unlock this node.`
          : 'All listed infrastructure nodes are unlocked and operational.',
        statLine:
          energyTodayUnits > 0
            ? `${formatUnitsAsKwh(energyTodayUnits)} earned today`
            : `${formatUnitsAsKwh(availableBudgetUnits)} currently available`,
        progress: {
          valuePct: gridUnlockProgressPct,
          label: nextGridNode ? 'Unlock progress' : 'Grid completion'
        },
        primaryAction: canDeployNextNode
          ? {
              label: 'Deploy node',
              href: '/energy'
            }
          : undefined
      }
    ]
  };

  const featureEnabled = process.env.NEXT_PUBLIC_HOME_ACTIVATION_TABLE !== '0';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060809] pb-24 lg:pb-10">
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)',
          backgroundSize: '100% 3px'
        }}
      />
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 opacity-[0.04]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,185,153,1), transparent 70%)' }}
      />
      {/* Tactical dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.03) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
        <CharacterHeroCard serverXp={stats.totalXp} />

        {/* Continue panels */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Theory panel */}
          <Link
            href={theoryAction.href}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-white/[0.06] bg-[rgba(8,12,10,0.95)] p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-[rgba(12,18,14,0.95)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04]">
                  <BookOpen className="h-4 w-4 text-[#34d399]" />
                </div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Theory
                </p>
              </div>

              <h3 className="font-mono text-lg font-bold uppercase tracking-[0.04em] text-white">
                {theoryTrackLabel}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                {theoryAction.progressLine}
              </p>

              {/* Progress bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                  <span>{theoryProgressValueLabel}</span>
                  <span>{theoryProgressPct}%</span>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${theoryProgressPct}%`, background: `rgb(${theoryAccentRgb})` }}
                  />
                </div>
              </div>
            </div>

            <div className="relative mt-6 flex items-center gap-2 font-mono text-[11px] font-semibold text-[#34d399] transition-colors group-hover:text-[#6ee7b7]">
              <span>{theoryAction.label}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Assignments panel */}
          <Link
            href={latestTaskAction.actionHref}
            className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-white/[0.06] bg-[rgba(8,12,10,0.95)] p-6 transition-all duration-200 hover:border-white/[0.12] hover:bg-[rgba(12,18,14,0.95)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04]">
                  <ClipboardCheck className="h-4 w-4" style={{ color: `rgb(${tasksAccentRgb})` }} />
                </div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">
                  Assignments
                </p>
              </div>

              <h3 className="font-mono text-lg font-bold uppercase tracking-[0.04em] text-white">
                {latestTaskAction.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                {latestTaskAction.summary}
              </p>

              {/* Progress bar (if available) */}
              {tasksProgressPct !== null && (
                <div className="mt-5 space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.2em] text-white/25">
                    <span>{latestTaskAction.statLine}</span>
                    <span>{tasksProgressPct}%</span>
                  </div>
                  <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${tasksProgressPct}%`, background: `rgb(${tasksAccentRgb})` }}
                    />
                  </div>
                </div>
              )}
              {tasksProgressPct === null && (
                <p className="mt-5 font-mono text-[10px] text-white/20">{latestTaskAction.statLine}</p>
              )}
            </div>

            <div className="relative mt-6 flex items-center gap-2 font-mono text-[11px] font-semibold transition-colors group-hover:text-white/80" style={{ color: `rgb(${tasksAccentRgb})` }}>
              <span>{latestTaskAction.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};
