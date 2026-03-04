'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import type { User } from '@supabase/supabase-js';
import { LearningGrid } from '@/components/home/home/LearningGrid';
import type {
  ConsoleMetric,
  LearningGridNode
} from '@/components/home/home/console-types';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import type { ReadingSignal } from '@/components/home/home/WeeklyActivityCard';
import {
  DEFAULT_DEPLOYED_NODE_IDS,
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
  icon: string;
  theoryPct: number;
  theoryCompleted: number;
  theoryTotal: number;
}

const FOCUS_GRID_LAYOUT: Array<{ x: number; y: number; mobileOrder: number }> = [
  { x: 16, y: 58, mobileOrder: 1 },
  { x: 37, y: 30, mobileOrder: 2 },
  { x: 57, y: 52, mobileOrder: 3 },
  { x: 78, y: 31, mobileOrder: 4 }
];

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
      const theoryPct =
        theoryTotal > 0 ? Math.round((theoryCompleted / theoryTotal) * 100) : 0;

      return {
        topicId,
        label: meta.label,
        icon: meta.icon,
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
      .sort((left, right) => {
        return left.theoryPct - right.theoryPct;
      })
      .find((snapshot) => snapshot.theoryPct < 100) ??
    topicSnapshots[0];

  const overallProgress = useMemo(() => {
    const theoryTotal = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.theoryTotal,
      0
    );
    const theoryCompleted = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.theoryCompleted,
      0
    );
    const theoryPct = theoryTotal > 0 ? (theoryCompleted / theoryTotal) * 100 : 0;
    return Math.round(theoryPct);
  }, [topicSnapshots]);
  const rawDisplayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Operator';
  const firstName = rawDisplayName.split(' ')[0] || 'Operator';
  const isFirstSession =
    !primarySession &&
    stats.questionsCompleted === 0 &&
    overallProgress === 0 &&
    readingSignals.length === 0;

  const recommendedNodeMeta = (() => {
    if (primarySession) {
      return {
        type: 'chapter' as const,
        topicId: primarySession.topic,
        nodeId: `${primarySession.topic}-chapter`
      };
    }

    if (nextGridNode && remainingGridUnits === 0) {
      return {
        type: 'grid' as const,
        topicId: null,
        nodeId: 'grid-ops'
      };
    }

    return {
      type: 'theory' as const,
      topicId: recommendedTopic.topicId,
      nodeId: `${recommendedTopic.topicId}-theory`
    };
  })();

  const primaryAction = (() => {
    if (recommendedNodeMeta.type === 'chapter' && primarySession) {
      const remainingSections = Math.max(
        primarySession.sectionsTotal - primarySession.sectionsRead,
        0
      );

      return {
        eyebrow: `Theory Beta route for ${firstName}`,
        title: `Resume ${getHomeTopicMeta(primarySession.topic).label} chapter ${primarySession.chapterNumber}.`,
        description: `You already completed ${primarySession.sectionsRead} of ${primarySession.sectionsTotal} sections. Finish the chapter while the context is fresh.`,
        href: `/learn/${primarySession.topic}/theory`,
        label: 'Resume chapter',
        meta:
          remainingSections > 0
            ? `${remainingSections} sections left in this route`
            : 'Only the final checkpoint remains'
      };
    }

    if (recommendedNodeMeta.type === 'grid' && nextGridNode) {
      return {
        eyebrow: `Theory Beta reward ready for ${firstName}`,
        title: `Deploy ${nextGridNode.name}.`,
        description: `You have enough kWh to change the simulation right now. Convert the learning work into a real grid upgrade before you open another topic.`,
        href: '/energy',
        label: 'Open Grid Ops',
        meta: `${formatUnitsAsKwh(availableBudgetUnits)} budget available`
      };
    }

    return {
      eyebrow: isFirstSession
        ? `Theory Beta first route for ${firstName}`
        : `Theory Beta next route for ${firstName}`,
      title: isFirstSession
        ? `Start with ${recommendedTopic.label}.`
        : `Continue with ${recommendedTopic.label}.`,
      description: isFirstSession
        ? 'Begin with the first theory chapter, then keep a consistent reading cadence to unlock the full Theory Beta route.'
        : 'This is the clearest next route based on what you have already finished and what remains locked.',
      href: `/learn/${recommendedTopic.topicId}/theory`,
      label: isFirstSession ? 'Start first chapter' : 'Open next chapter',
      meta: isFirstSession
        ? 'First session: chapter one, then continue chapter two'
        : `${recommendedTopic.theoryCompleted}/${recommendedTopic.theoryTotal} chapters complete`
    };
  })();

  const primaryActionHref = primaryAction.href;
  const theoryRouteHref = `/learn/${recommendedTopic.topicId}/theory`;

  const statusMetrics: ConsoleMetric[] = [
    {
      id: 'budget',
      label: 'Budget',
      value: formatUnitsAsKwh(availableBudgetUnits),
      status:
        remainingGridUnits === 0
          ? 'stable'
          : energyTodayUnits > 0
            ? 'improving'
            : 'degrading',
      detail: nextGridNode
        ? `Next unlock: ${nextGridNode.name}`
        : 'All listed grid nodes unlocked',
      actionLabel: 'Open Grid',
      actionHref: '/energy'
    },
    {
      id: 'streak',
      label: 'Streak',
      value:
        stats.currentStreak > 0
          ? `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`
          : 'Inactive',
      status:
        studySessionsToday > 0
          ? 'stable'
          : stats.currentStreak > 0
            ? 'degrading'
            : 'improving',
      detail:
        studySessionsToday > 0
          ? 'Today already has reading momentum'
          : 'Open one reading session to stabilize it',
      actionLabel: 'Open Theory',
      actionHref: '/learn/theory'
    },
    {
      id: 'accuracy',
      label: 'Continuity',
      value: primarySession
        ? `${primarySession.sectionsRead}/${primarySession.sectionsTotal}`
        : 'No route',
      status:
        primarySession ? 'improving' : overallProgress > 0 ? 'stable' : 'degrading',
      detail:
        primarySession
          ? 'Current chapter resume is active'
          : 'Start the first chapter to establish continuity',
      actionLabel: primarySession ? 'Resume chapter' : 'Open Theory',
      actionHref: primarySession ? `/learn/${primarySession.topic}/theory` : '/learn/theory'
    },
    {
      id: 'progress',
      label: 'Progress',
      value: `${overallProgress}%`,
      status:
        primarySession || overallProgress > 40
          ? 'improving'
          : overallProgress > 0
            ? 'stable'
            : 'degrading',
      detail: primarySession
        ? `${getHomeTopicMeta(primarySession.topic).label} chapter is live`
        : recommendedNodeMeta.type === 'grid' && nextGridNode
            ? `${nextGridNode.name} is ready to deploy`
            : `${recommendedTopic.label} is the clearest next route`,
      actionLabel: primaryAction.label,
      actionHref: primaryActionHref
    }
  ];

  const gridNodes: LearningGridNode[] = [
    buildGlobalNode({
      id: 'control-center',
      label: 'Control Center',
      shortLabel: 'Control Center',
      description:
        'Start here, then move into your current topic and the next recommended lesson.',
      detail: 'This is the starting point for the current learning route.',
      state:
        stats.questionsCompleted > 0 || readingSignals.length > 0
          ? 'completed'
          : 'available',
      kind: 'mission',
      symbol: '◉',
      actions: [
        {
          label: 'Open learning route',
          href: theoryRouteHref
        },
        { label: 'Open Grid Ops', href: '/energy', variant: 'ghost' }
      ]
    }),
    buildGlobalNode({
      id: 'grid-ops',
      label: nextGridNode ? nextGridNode.name : 'Grid Ops ready',
      shortLabel: 'Grid Ops',
      description: nextGridNode
        ? remainingGridUnits === 0
          ? `${nextGridNode.name} is ready to deploy from Grid Ops.`
          : `${formatUnitsAsKwh(remainingGridUnits)} more unlocks ${nextGridNode.name}.`
        : 'All listed grid deployments are available.',
      detail: nextGridNode
        ? remainingGridUnits === 0
          ? 'Reward ready'
          : 'Reward charging'
        : 'Grid stable',
      state:
        recommendedNodeMeta.nodeId === 'grid-ops'
          ? 'recommended'
          : nextGridNode
            ? remainingGridUnits === 0
              ? 'available'
              : 'locked'
            : 'completed',
      kind: 'grid',
      symbol: '⌁',
      actions: [
        { label: 'Open Grid Ops', href: '/energy' },
        { label: 'Return to theory', href: theoryRouteHref, variant: 'secondary' }
      ]
    }),
    ...topicSnapshots.flatMap((snapshot) =>
      buildTopicCluster({
        snapshot,
        primarySession,
        recommendedNodeMeta
      })
    )
  ];

  const gridNodeMap = new Map(gridNodes.map((node) => [node.id, node]));
  const focusTopicId = recommendedNodeMeta.topicId ?? recommendedTopic.topicId;
  const focusedGridNodeIds = Array.from(
    new Set(
      [
        'control-center',
        focusTopicId ? `${focusTopicId}-topic` : null,
        recommendedNodeMeta.nodeId,
        nextGridNode && remainingGridUnits === 0 ? 'grid-ops' : null
      ].filter((nodeId): nodeId is string => Boolean(nodeId))
    )
  ).filter((nodeId) => gridNodeMap.has(nodeId));
  const focusedGridNodes = focusedGridNodeIds
    .slice(0, 4)
    .map((nodeId, index) => {
      const node = gridNodeMap.get(nodeId);
      const layout =
        FOCUS_GRID_LAYOUT[index] ?? FOCUS_GRID_LAYOUT[FOCUS_GRID_LAYOUT.length - 1];

      return node
        ? {
            ...node,
            position: {
              x: layout.x,
              y: layout.y
            },
            mobileOrder: layout.mobileOrder
          }
        : null;
    })
    .filter((node): node is LearningGridNode => Boolean(node));
  const focusedGridLinks = focusedGridNodeIds
    .slice(0, focusedGridNodes.length)
    .slice(0, -1)
    .map((nodeId, index) => ({
      from: nodeId,
      to: focusedGridNodeIds[index + 1]
    }));

  return (
    <div className="relative min-h-screen overflow-hidden bg-light-bg pb-24 dark:bg-dark-bg lg:pb-10">
      <div className="pointer-events-none absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.07),transparent_26%),radial-gradient(circle_at_84%_12%,rgba(16,185,129,0.05),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.03),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(16,185,129,0.08),transparent_28%)]" />
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
        <LearningGrid
          metrics={statusMetrics}
          nodes={focusedGridNodes}
          links={focusedGridLinks}
          recommendedNodeId={recommendedNodeMeta.nodeId}
        />
      </div>
    </div>
  );
};

const buildGlobalNode = (
  node: Omit<LearningGridNode, 'topic' | 'position' | 'mobileOrder'>
): LearningGridNode => ({
  ...node,
  position: { x: 50, y: 50 },
  mobileOrder: 99
});

const buildTopicCluster = ({
  snapshot,
  primarySession,
  recommendedNodeMeta
}: {
  snapshot: TopicSnapshot;
  primarySession: ReadingSession | null;
  recommendedNodeMeta: {
    type: 'chapter' | 'grid' | 'theory';
    topicId: Topic | null;
    nodeId: string;
  };
}): LearningGridNode[] => {
  const meta = getHomeTopicMeta(snapshot.topicId);
  const chapterLabel =
    primarySession?.topic === snapshot.topicId
      ? `Ch.${primarySession.chapterNumber}`
      : snapshot.theoryCompleted > 0
        ? `Next chapter`
        : 'Start chapter';
  const topicStarted = snapshot.theoryCompleted > 0;
  const topicState: LearningGridNode['state'] =
    snapshot.theoryPct >= 100
      ? 'completed'
      : topicStarted
        ? 'in_progress'
        : 'available';

  return [
    {
      id: `${snapshot.topicId}-topic`,
      label: `${snapshot.label} cluster`,
      shortLabel: snapshot.label,
      description: `${snapshot.label} theory route and chapter progression.`,
      detail: topicStarted
        ? `${snapshot.theoryCompleted}/${snapshot.theoryTotal} chapters complete`
        : 'Ready to start',
      state: topicState,
      kind: 'topic',
      topic: snapshot.topicId,
      symbol: meta.icon,
      hint: topicStarted ? 'Cluster active' : 'Cluster ready',
      position: { x: 50, y: 50 },
      mobileOrder: 99,
      actions: [
        { label: 'Open theory', href: `/learn/${snapshot.topicId}/theory` },
        {
          label: 'Open theory topics',
          href: '/learn/theory',
          variant: 'secondary'
        }
      ]
    },
    {
      id: `${snapshot.topicId}-theory`,
      label: `${snapshot.label} theory route`,
      shortLabel: `${snapshot.label} theory`,
      description: `Structured theory path for ${snapshot.label}.`,
      detail:
        snapshot.theoryPct > 0
          ? `${snapshot.theoryPct}% theory complete`
          : 'Best place to start the topic',
      state:
        recommendedNodeMeta.nodeId === `${snapshot.topicId}-theory`
          ? 'recommended'
          : snapshot.theoryPct >= 100
            ? 'completed'
            : snapshot.theoryPct > 0
              ? 'in_progress'
              : 'available',
      kind: 'theory',
      topic: snapshot.topicId,
      symbol: '◌',
      hint: snapshot.theoryPct > 0 ? 'Resume theory' : 'Open route',
      position: { x: 50, y: 50 },
      mobileOrder: 99,
      actions: [
        {
          label: snapshot.theoryPct > 0 ? 'Continue theory' : 'Start theory',
          href: `/learn/${snapshot.topicId}/theory`
        },
        { label: 'View all topics', href: '/learn/theory', variant: 'secondary' }
      ]
    },
    {
      id: `${snapshot.topicId}-chapter`,
      label: `${snapshot.label} ${chapterLabel}`,
      shortLabel: chapterLabel,
      description:
        primarySession?.topic === snapshot.topicId
          ? `Continue the live ${snapshot.label} chapter.`
          : `Open the next chapter in ${snapshot.label}.`,
      detail:
        primarySession?.topic === snapshot.topicId
          ? `${Math.max(0, primarySession.sectionsTotal - primarySession.sectionsRead)} sections remaining`
          : snapshot.theoryPct > 0
            ? 'Next theory checkpoint'
            : 'Theory route not started',
      state:
        recommendedNodeMeta.nodeId === `${snapshot.topicId}-chapter`
          ? 'recommended'
          : primarySession?.topic === snapshot.topicId
            ? 'in_progress'
            : snapshot.theoryPct >= 100
              ? 'completed'
              : topicStarted
                ? 'available'
                : 'locked',
      kind: 'chapter',
      topic: snapshot.topicId,
      symbol: '◎',
      hint: primarySession?.topic === snapshot.topicId ? 'Live chapter' : 'Next lesson',
      position: { x: 50, y: 50 },
      mobileOrder: 99,
      actions: [
        {
          label:
            primarySession?.topic === snapshot.topicId
              ? 'Continue chapter'
              : 'Open chapter',
          href: `/learn/${snapshot.topicId}/theory`
        },
        {
          label: 'Open theory',
          href: `/learn/${snapshot.topicId}/theory`,
          variant: 'ghost'
        }
      ]
    }
  ];
};
