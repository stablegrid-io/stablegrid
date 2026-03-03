'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import { LearningGrid } from '@/components/home/home/LearningGrid';
import type {
  ConsoleMetric,
  LearningGridNode
} from '@/components/home/home/console-types';
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
  icon: string;
  theoryPct: number;
  theoryCompleted: number;
  theoryTotal: number;
  practicePct: number;
  practiceAttempted: number;
  practiceTotal: number;
  accuracy: number | null;
  recentWrongCount: number;
}

const DAILY_PRACTICE_TARGET = 4;
const FOCUS_GRID_LAYOUT: Array<{ x: number; y: number; mobileOrder: number }> = [
  { x: 16, y: 58, mobileOrder: 1 },
  { x: 37, y: 30, mobileOrder: 2 },
  { x: 57, y: 52, mobileOrder: 3 },
  { x: 78, y: 31, mobileOrder: 4 }
];

export const HomeDashboard = ({
  topicProgress,
  recentSessions,
  readingSignals,
  stats
}: HomeDashboardProps) => {
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const dailyEnergy = useProgressStore((state) => state.dailyXP);
  const deployedNodeIds = useProgressStore((state) => state.deployedNodeIds);

  const todayKey = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const questionsToday = useMemo(
    () =>
      questionHistory.filter(
        (entry) => format(new Date(entry.timestamp), 'yyyy-MM-dd') === todayKey
      ).length,
    [questionHistory, todayKey]
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
      const practiceTotal =
        progress?.practiceQuestionsTotal && progress.practiceQuestionsTotal > 0
          ? progress.practiceQuestionsTotal
          : meta.fallbackQuestions;
      const practiceAttempted = progress?.practiceQuestionsAttempted ?? 0;
      const practiceCorrect = progress?.practiceQuestionsCorrect ?? 0;
      const practicePct =
        practiceTotal > 0 ? Math.round((practiceAttempted / practiceTotal) * 100) : 0;
      const accuracy =
        practiceAttempted > 0
          ? Math.round((practiceCorrect / practiceAttempted) * 100)
          : null;
      const recentWrongCount = questionHistory
        .slice(-16)
        .filter((attempt) => attempt.topic === topicId && !attempt.correct).length;

      return {
        topicId,
        label: meta.label,
        icon: meta.icon,
        theoryPct,
        theoryCompleted,
        theoryTotal,
        practicePct,
        practiceAttempted,
        practiceTotal,
        accuracy,
        recentWrongCount
      };
    });
  }, [questionHistory, topicProgress]);

  const primarySession = recentSessions[0] ?? null;
  const recommendedTopic =
    (primarySession
      ? topicSnapshots.find((snapshot) => snapshot.topicId === primarySession.topic)
      : null) ??
    [...topicSnapshots]
      .sort((left, right) => {
        const leftScore =
          left.recentWrongCount * 10 + left.practiceAttempted + left.theoryCompleted;
        const rightScore =
          right.recentWrongCount * 10 + right.practiceAttempted + right.theoryCompleted;
        return rightScore - leftScore;
      })
      .find((snapshot) => snapshot.theoryPct < 100 || snapshot.recentWrongCount > 0) ??
    topicSnapshots[0];

  const weakestTopic =
    [...topicSnapshots]
      .filter((snapshot) => snapshot.accuracy !== null)
      .sort((left, right) => (left.accuracy ?? 100) - (right.accuracy ?? 100))[0] ?? null;
  const reviewTopic =
    topicSnapshots.find((snapshot) => snapshot.recentWrongCount > 0) ?? weakestTopic;

  const overallProgress = useMemo(() => {
    const theoryTotal = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.theoryTotal,
      0
    );
    const theoryCompleted = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.theoryCompleted,
      0
    );
    const practiceTotal = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.practiceTotal,
      0
    );
    const practiceAttempted = topicSnapshots.reduce(
      (sum, snapshot) => sum + snapshot.practiceAttempted,
      0
    );

    const theoryPct = theoryTotal > 0 ? (theoryCompleted / theoryTotal) * 100 : 0;
    const practicePct = practiceTotal > 0 ? (practiceAttempted / practiceTotal) * 100 : 0;
    return Math.round((theoryPct + practicePct) / 2);
  }, [topicSnapshots]);

  const recommendedNodeMeta = (() => {
    if (primarySession) {
      return {
        type: 'chapter' as const,
        topicId: primarySession.topic,
        nodeId: `${primarySession.topic}-chapter`
      };
    }

    if (reviewTopic && reviewTopic.recentWrongCount > 0) {
      return {
        type: 'review' as const,
        topicId: reviewTopic.topicId,
        nodeId: `${reviewTopic.topicId}-review`
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

  const primaryActionHref = primarySession
    ? `/learn/${primarySession.topic}/theory`
    : `/learn/${recommendedTopic.topicId}/theory`;
  const primaryActionLabel = primarySession ? 'Resume route' : 'Open route';

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
        questionsToday > 0
          ? 'stable'
          : stats.currentStreak > 0
            ? 'degrading'
            : 'improving',
      detail:
        questionsToday > 0
          ? 'Today already has momentum'
          : 'One short sprint will stabilize it',
      actionLabel: 'Fix streak',
      actionHref: '/practice/setup'
    },
    {
      id: 'accuracy',
      label: 'Accuracy',
      value: stats.questionsCompleted > 0 ? `${stats.overallAccuracy}%` : 'No data',
      status:
        stats.questionsCompleted === 0
          ? 'improving'
          : stats.overallAccuracy >= 75
            ? 'stable'
            : 'degrading',
      detail:
        reviewTopic && reviewTopic.recentWrongCount > 0
          ? `${reviewTopic.recentWrongCount} answers need review`
          : 'Recent practice is under control',
      actionLabel: 'Fix accuracy',
      actionHref: reviewTopic ? `/practice/${reviewTopic.topicId}` : '/practice/setup'
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
        : `${recommendedTopic.label} is the clearest next route`,
      actionLabel: 'Open route',
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
          href: `/learn/${recommendedTopic.topicId}/theory`
        },
        { label: 'Start practice', href: '/practice/setup', variant: 'secondary' },
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
        { label: 'Return to theory', href: primaryActionHref, variant: 'secondary' }
      ]
    }),
    ...topicSnapshots.flatMap((snapshot) =>
      buildTopicCluster({
        snapshot,
        primarySession,
        recommendedNodeMeta,
        reviewTopicId: reviewTopic?.topicId ?? null
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

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 pb-16 pt-6 sm:px-6 lg:gap-5 lg:pb-10 lg:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.42 }}
        >
          <LearningGrid
            metrics={statusMetrics}
            primaryActionHref={primaryActionHref}
            primaryActionLabel={primaryActionLabel}
            nodes={focusedGridNodes}
            links={focusedGridLinks}
            recommendedNodeId={recommendedNodeMeta.nodeId}
          />
        </motion.div>
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
  recommendedNodeMeta,
  reviewTopicId
}: {
  snapshot: TopicSnapshot;
  primarySession: ReadingSession | null;
  recommendedNodeMeta: {
    type: 'chapter' | 'review' | 'grid' | 'theory';
    topicId: Topic | null;
    nodeId: string;
  };
  reviewTopicId: Topic | null;
}): LearningGridNode[] => {
  const meta = getHomeTopicMeta(snapshot.topicId);
  const chapterLabel =
    primarySession?.topic === snapshot.topicId
      ? `Ch.${primarySession.chapterNumber}`
      : snapshot.theoryCompleted > 0
        ? `Next chapter`
        : 'Start chapter';
  const topicStarted = snapshot.theoryCompleted > 0 || snapshot.practiceAttempted > 0;
  const reviewAvailable =
    snapshot.recentWrongCount > 0 || reviewTopicId === snapshot.topicId;
  const topicState: LearningGridNode['state'] =
    snapshot.theoryPct >= 100 && snapshot.practicePct >= 100
      ? 'completed'
      : topicStarted
        ? 'in_progress'
        : 'available';

  return [
    {
      id: `${snapshot.topicId}-topic`,
      label: `${snapshot.label} cluster`,
      shortLabel: snapshot.label,
      description: `${snapshot.label} theory, practice, and review routes.`,
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
          label: 'Start practice',
          href: `/practice/${snapshot.topicId}`,
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
        { label: 'Practice', href: `/practice/${snapshot.topicId}`, variant: 'secondary' }
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
          label: 'Practice',
          href: `/practice/${snapshot.topicId}`,
          variant: 'secondary'
        },
        {
          label: 'Review mistakes',
          href: `/practice/${snapshot.topicId}`,
          variant: 'ghost'
        }
      ]
    },
    {
      id: `${snapshot.topicId}-practice`,
      label: `${snapshot.label} practice`,
      shortLabel: `${snapshot.label} practice`,
      description: `Run focused questions for ${snapshot.label}.`,
      detail:
        snapshot.practiceAttempted > 0
          ? `${snapshot.practiceAttempted}/${snapshot.practiceTotal} questions attempted`
          : 'No sprint run yet',
      state:
        snapshot.practicePct >= 100 && snapshot.practiceAttempted > 0
          ? 'completed'
          : snapshot.practiceAttempted > 0
            ? 'in_progress'
            : 'available',
      kind: 'practice',
      topic: snapshot.topicId,
      symbol: '△',
      hint: 'Practice sprint',
      position: { x: 50, y: 50 },
      mobileOrder: 99,
      actions: [
        { label: 'Start practice', href: `/practice/${snapshot.topicId}` },
        {
          label: 'Open theory',
          href: `/learn/${snapshot.topicId}/theory`,
          variant: 'secondary'
        }
      ]
    },
    {
      id: `${snapshot.topicId}-review`,
      label: `${snapshot.label} review`,
      shortLabel: `${snapshot.label} review`,
      description: `Review mistakes and recover weak spots in ${snapshot.label}.`,
      detail:
        snapshot.recentWrongCount > 0
          ? `${snapshot.recentWrongCount} recent miss${snapshot.recentWrongCount === 1 ? '' : 'es'}`
          : 'No urgent review alerts',
      state:
        recommendedNodeMeta.nodeId === `${snapshot.topicId}-review`
          ? 'recommended'
          : reviewAvailable
            ? 'available'
            : 'locked',
      kind: 'review',
      topic: snapshot.topicId,
      symbol: '✦',
      hint: reviewAvailable ? 'Fix weak spots' : 'No review needed',
      position: { x: 50, y: 50 },
      mobileOrder: 99,
      actions: [
        { label: 'Review mistakes', href: `/practice/${snapshot.topicId}` },
        {
          label: 'Start practice',
          href: `/practice/${snapshot.topicId}`,
          variant: 'secondary'
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
