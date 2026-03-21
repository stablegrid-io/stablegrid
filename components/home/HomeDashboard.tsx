'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { sortModulesByOrder } from '@/lib/learn/freezeTheoryDoc';

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
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* 3-column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">

        {/* Left: Theory Tree */}
        <section className="lg:col-span-3 border-r border-outline-variant/20 overflow-y-auto p-4 bg-surface-dim/40">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline font-bold text-xs tracking-widest text-primary">THEORY_TREE</h3>
            <span className="font-mono text-[9px] text-primary/40">[MOD: {recommendedTopic.theoryCompleted}/{recommendedTopic.theoryTotal}]</span>
          </div>
          <div className="relative pl-4 space-y-2 before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[1px] before:bg-outline-variant/30">
            {(() => {
              // Get real module titles from theory doc
              const doc = theoryDocs[moduleTopicId];
              const tracks = doc ? getTheoryTracks(doc) : [];
              const allModules = tracks.length > 0
                ? tracks.flatMap((t) => sortModulesByOrder(t.chapters))
                : doc ? sortModulesByOrder(doc.modules ?? doc.chapters) : [];

              const activeTopicSessions = recentSessions
                .filter((s) => s.topic === moduleTopicId)
                .sort((a, b) => a.chapterNumber - b.chapterNumber);
              const completedChapterIds = new Set(
                activeTopicSessions.filter((s) => s.completedAt).map((s) => s.chapterId)
              );
              const activeChapterNumber = latestSession?.topic === moduleTopicId
                ? latestSession.chapterNumber
                : (activeTopicSessions[activeTopicSessions.length - 1]?.chapterNumber ?? 1);

              const stripModulePrefix = (title: string) =>
                title.replace(/^module\s*\d+\s*:\s*/i, '').trim();

              return allModules.slice(0, 10).map((mod, index) => {
                const num = index + 1;
                const isCompleted = completedChapterIds.has(mod.id);
                const isActive = num === activeChapterNumber && !isCompleted;
                const isLocked = num > activeChapterNumber && !isCompleted;
                const title = stripModulePrefix(mod.title) || mod.title;
                const session = activeTopicSessions.find((s) => s.chapterId === mod.id);
                const progressBars = session && !isCompleted
                  ? Math.round((session.sectionsRead / Math.max(1, session.sectionsTotal)) * 4)
                  : 0;

                return (
                  <Link
                    key={mod.id}
                    href={`/learn/${moduleTopicId}/theory`}
                    className="relative flex items-center gap-3 group py-1.5"
                  >
                    <div className={`z-10 w-8 h-8 border flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'border-primary bg-primary/20 shadow-[0_0_12px_rgba(153,247,255,0.4)]'
                        : isActive
                          ? 'border-2 border-primary bg-primary/20 shadow-[0_0_15px_rgba(153,247,255,0.3)]'
                          : 'border-outline-variant bg-surface-container opacity-40'
                    }`}>
                      {isCompleted ? (
                        <span className="text-primary text-xs">✓</span>
                      ) : isActive ? (
                        <span className="text-primary text-xs">▶</span>
                      ) : (
                        <span className="text-outline-variant text-xs">○</span>
                      )}
                    </div>
                    <div className={isCompleted || isActive ? '' : 'opacity-40'}>
                      <p className={`text-[8px] font-mono mb-0.5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        M-{String(num).padStart(2, '0')}{isActive ? ' [ACTIVE]' : ''}
                      </p>
                      <h4 className={`text-[11px] font-bold uppercase tracking-wide leading-tight ${
                        isActive ? 'font-headline text-primary' : isCompleted ? 'font-mono text-primary/70' : 'font-mono text-on-surface/40'
                      }`}>
                        {title}
                      </h4>
                      {isCompleted && (
                        <span className="text-[7px] font-mono bg-primary/15 text-primary px-1.5 py-0.5 mt-0.5 inline-block shadow-[0_0_8px_rgba(153,247,255,0.2)]">SYNCED</span>
                      )}
                      {isActive && (
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 4 }, (_, i) => (
                            <div key={i} className={`h-1 w-4 ${i < progressBars ? 'bg-primary' : 'bg-outline-variant/40'}`} />
                          ))}
                        </div>
                      )}
                      {isLocked && (
                        <span className="text-[7px] font-mono text-outline-variant">LOCKED</span>
                      )}
                    </div>
                  </Link>
                );
              });
            })()}
          </div>
        </section>

        {/* Center: Neural Sync Port */}
        <section className="lg:col-span-6 relative flex flex-col items-center justify-center overflow-hidden bg-surface-container-lowest">
          {/* HUD corners */}
          <div className="absolute top-3 left-3 border-l border-t border-primary/30 w-8 h-8" />
          <div className="absolute top-3 right-3 border-r border-t border-primary/30 w-8 h-8" />
          <div className="absolute bottom-3 left-3 border-l border-b border-primary/30 w-8 h-8" />
          <div className="absolute bottom-3 right-3 border-r border-b border-primary/30 w-8 h-8" />


          <div className="relative z-10 text-center">
            {/* Level + XP info above */}
            <div className="mb-3 flex items-center justify-center gap-4">
              <div className="text-right">
                <div className="font-mono text-[7px] text-primary/40 uppercase tracking-widest">SYSTEM_LVL</div>
                <div className="font-headline text-xl font-black text-primary">{Math.floor(stats.totalXp / 1000)}</div>
              </div>
              <div className="h-6 w-px bg-primary/20" />
              <div className="text-left">
                <div className="font-mono text-[7px] text-primary/40 uppercase tracking-widest">XP_TOTAL</div>
                <div className="font-mono text-sm font-bold text-on-surface">{stats.totalXp.toLocaleString()}</div>
              </div>
            </div>

            {/* Avatar */}
            <div className="relative inline-block mb-3">
              <div className="relative w-56 h-72 bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden group">
                <Image
                  src="/grid-assets/operator-avatar.jpg"
                  alt={`Operator ${firstName}`}
                  fill
                  className="object-cover grayscale brightness-125 contrast-125"
                  unoptimized
                />
              </div>

            </div>

            {/* Operator name */}
            <h2 className="font-headline text-sm font-black text-on-surface tracking-widest uppercase mt-2">
              OPERATOR {firstName.toUpperCase()}
            </h2>

          </div>

          {/* Bottom HUD stats */}
          <div className="absolute bottom-3 w-full px-6 flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[7px] font-mono text-primary/40">HULL_INTEGRITY</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`h-2 w-2 ${i < Math.round((overallProgress / 100) * 8) ? 'bg-primary' : 'bg-outline-variant/20'}`} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[7px] font-mono text-primary/40">THROUGHPUT</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className={`h-2 w-2 ${i < Math.min(stats.currentStreak, 4) ? 'bg-secondary' : 'bg-outline-variant/20'}`} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right: Mission Briefing */}
        <section className="lg:col-span-3 overflow-y-auto p-4 bg-surface-dim/40 border-l border-outline-variant/20">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-headline font-bold text-xs tracking-widest text-primary">MISSION_BRIEFING</h3>
            <span className="font-mono text-[9px] text-tertiary">[{topicSnapshots.filter(s => s.theoryPct > 0 && s.theoryPct < 100).length} ACTIVE]</span>
          </div>
          <div className="space-y-3">
            {/* System update */}
            <div className="p-3 bg-tertiary/10 border-l-4 border-tertiary">
              <div className="flex items-start justify-between mb-2">
                <span className="text-[8px] font-mono text-tertiary font-bold px-1.5 py-0.5 bg-tertiary/20">SYSTEM UPDATE</span>
              </div>
              <h4 className="text-xs font-headline font-bold text-on-surface mb-1">SYNC_STATUS: {overallProgress}%</h4>
              <p className="text-[9px] font-mono text-on-surface-variant leading-relaxed">
                {overallProgress < 50 ? 'Continue theory modules to increase sync rate.' : 'Neural integration progressing well.'}
              </p>
            </div>

            {/* Active assignment */}
            <Link href={theoryAction.href} className="block p-3 bg-surface-container-high/60 border border-outline-variant/30 hover:border-primary/40 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 bg-primary" />
                <span className="text-[8px] font-mono text-primary/60">ACTIVE_ASSIGNMENT</span>
              </div>
              <h4 className="text-xs font-headline font-bold text-on-surface mb-1 uppercase tracking-tight">{theoryTrackLabel}</h4>
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className={`h-1.5 w-3 ${i < Math.round((theoryProgressPct / 100) * 5) ? 'bg-primary' : 'bg-outline-variant/30'}`} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-primary font-bold group-hover:translate-x-1 transition-transform">RESUME &gt;&gt;</span>
              </div>
            </Link>

            {/* Operations task */}
            <Link href={latestTaskAction.actionHref} className="block p-3 bg-surface-container-high/60 border border-outline-variant/30 hover:border-primary/40 transition-colors group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-1 bg-secondary" />
                <span className="text-[8px] font-mono text-secondary/60">DAILY_OPERATION</span>
              </div>
              <h4 className="text-xs font-headline font-bold text-on-surface mb-1 uppercase tracking-tight">{latestTaskAction.title}</h4>
              <p className="text-[9px] font-mono text-on-surface-variant">{latestTaskAction.summary}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[9px] font-mono text-tertiary">{latestTaskAction.statLine}</span>
                <span className="text-[9px] font-mono text-on-surface-variant">START_TASK</span>
              </div>
            </Link>

            {/* Grid telemetry */}
            <div className="mt-4 p-3 glass-panel border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-1 bg-primary" />
                <span className="text-[8px] font-mono text-primary tracking-widest uppercase font-bold">GRID_TELEMETRY</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-on-surface-variant">QUESTIONS</span>
                  <span className="text-on-surface">{stats.questionsCompleted}</span>
                </div>
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-on-surface-variant">ACCURACY</span>
                  <span className="text-primary">{stats.overallAccuracy}%</span>
                </div>
                <div className="w-full h-px bg-outline-variant/20" />
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-on-surface-variant">NETWORK</span>
                  <span className="text-primary">ENCRYPTED</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer shell */}
      <footer className="h-7 border-t border-outline-variant/20 flex items-center justify-between px-4 bg-surface-dim flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-[8px] font-mono text-primary font-bold">SYSTEM_LOGS</span>
          <div className="h-3 w-[1px] bg-outline-variant/30" />
          <span className="text-[8px] font-mono text-on-surface-variant">
            <span className="text-primary">INFO</span> :: Neural buffer synchronized.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="text-[8px] font-mono text-primary tracking-widest uppercase">NEURAL_LINK: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
};
