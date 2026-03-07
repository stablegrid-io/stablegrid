'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import { HomeActivationTable } from '@/components/home/activation-table/HomeActivationTable';
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

export const HomeDashboard = ({
  user,
  topicProgress,
  recentSessions,
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

  const primarySession = recentSessions[0] ?? null;
  const recommendedTopic =
    (primarySession
      ? topicSnapshots.find((snapshot) => snapshot.topicId === primarySession.topic)
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
  const moduleLabel = getHomeTopicMeta(primarySession?.topic ?? recommendedTopic.topicId).label;
  const theoryRouteHref = `/learn/${recommendedTopic.topicId}/theory`;
  const userDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Operator';
  const firstName = userDisplayName.split(' ')[0] ?? userDisplayName;
  const remainingSections = primarySession
    ? Math.max(0, primarySession.sectionsTotal - primarySession.sectionsRead)
    : 0;

  const primaryAction = (() => {
    if (primarySession) {
      return {
        label: 'Resume module',
        href: `/learn/${primarySession.topic}/theory`,
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

  const activationData: HomeActivationTableData = {
    greeting: {
      title: `Welcome back, ${firstName}`,
      subtitle: [
        primarySession ? `${moduleLabel} · Chapter ${primarySession.chapterNumber}` : `${moduleLabel} route`,
        `${overallProgress}% complete`,
        studySessionsToday > 0
          ? 'Active today'
          : stats.currentStreak > 0
            ? `${stats.currentStreak}-day momentum`
            : 'Momentum inactive'
      ].join(' · ')
    },
    categories: [
      {
        kind: 'theory',
        label: 'Theory',
        title: moduleLabel,
        summary: primarySession
          ? 'Resume the active chapter and keep continuity.'
          : 'Continue the clearest theory route to maintain momentum.',
        statLine: primaryAction.progressLine,
        primaryAction: {
          label: primarySession ? 'Resume chapter' : hasRecentActivity ? 'Open module' : 'Start module',
          href: primaryAction.href
        },
        secondaryAction: {
          label: 'View theory path',
          href: theoryRouteHref
        }
      },
      {
        kind: 'tasks',
        label: 'Tasks',
        title: 'Task Deck',
        summary:
          stats.questionsCompleted > 0
            ? `${stats.questionsCompleted} recall checks completed. Keep your retention active.`
            : 'Notebooks, missions, and flashcards are ready for your next execution block.',
        statLine:
          readingSignals.length > 0
            ? `${readingSignals.length} recap entries available`
            : 'No recap entries yet',
        primaryAction: {
          label: 'Open tasks',
          href: '/tasks'
        },
        secondaryAction: {
          label: readingSignals.length > 0 ? 'Resume notebooks' : 'Open flashcards',
          href: readingSignals.length > 0 ? '/practice/notebooks' : '/flashcards'
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
        primaryAction: {
          label: nextGridNode && remainingGridUnits === 0 ? 'Deploy node' : 'Open Grid Ops',
          href: '/energy'
        },
        secondaryAction: {
          label: nextGridNode && remainingGridUnits > 0 ? 'Earn kWh in theory' : 'Review task deck',
          href: nextGridNode && remainingGridUnits > 0 ? theoryRouteHref : '/tasks'
        }
      }
    ]
  };

  const featureEnabled = process.env.NEXT_PUBLIC_HOME_ACTIVATION_TABLE !== '0';

  return (
    <div className="relative min-h-screen overflow-hidden bg-light-bg pb-24 dark:bg-dark-bg lg:pb-10">
      <div className="pointer-events-none absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_20%_18%,rgba(10,10,10,0.06),transparent_26%),radial-gradient(circle_at_84%_12%,rgba(10,10,10,0.04),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.03),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(34,185,153,0.08),transparent_30%)]" />
      <div
        className="pointer-events-none absolute inset-0 dark:hidden"
        style={{
          backgroundImage:
            'linear-gradient(rgba(10,10,10,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.04) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,250,250,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.03) 1px, transparent 1px)',
          backgroundSize: '42px 42px'
        }}
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:pb-10 lg:pt-8">
        <HomeActivationTable
          data={activationData}
          featureEnabled={featureEnabled}
        />
      </div>
    </div>
  );
};
