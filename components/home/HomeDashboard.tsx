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
      {/* Header Metrics Bar */}
      <section className="h-14 flex items-center justify-between px-6 border-b border-outline-variant/20 bg-surface-container-low/40 flex-shrink-0">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-primary/40 tracking-widest">SYSTEM_LVL</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-headline font-black text-primary">{Math.floor(stats.totalXp / 1000)}</span>
              <div className="flex gap-[2px]">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className={`h-3 w-1 ${i < Math.min(5, Math.floor(stats.totalXp / 2000)) ? 'bg-primary' : 'bg-outline-variant/30'}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-primary/40 tracking-widest">XP_TOTAL</span>
            <span className="text-base font-mono font-bold text-on-surface">
              {stats.totalXp.toLocaleString()} <span className="text-[10px] text-primary/50">/ {((Math.floor(stats.totalXp / 10000) + 1) * 10000).toLocaleString()}</span>
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6">
          <div className="flex items-center gap-3 bg-surface-container-high px-4 py-1.5 border-x border-primary/20">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-primary/40">CURRENT_TITLE</span>
              <span className="text-xs font-mono font-bold text-on-surface tracking-widest uppercase">{firstName}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-mono text-tertiary/40 tracking-widest">STREAK_ACTIVE</span>
            <span className="text-lg font-headline font-bold text-tertiary">{stats.currentStreak}_DAYS</span>
          </div>
        </div>
      </section>

      {/* 3-column grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">

        {/* Left: Theory Tree */}
        <section className="lg:col-span-3 border-r border-outline-variant/20 overflow-y-auto p-5 bg-surface-dim/40">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm tracking-widest text-primary">THEORY_TREE</h3>
            <span className="font-mono text-[9px] text-primary/40">[MOD: {recommendedTopic.theoryCompleted}/{recommendedTopic.theoryTotal}]</span>
          </div>
          <div className="relative pl-4 space-y-8 before:absolute before:left-[15px] before:top-4 before:bottom-4 before:w-[1px] before:bg-outline-variant/30">
            {(() => {
              // Build module nodes from the active topic's chapters
              const activeTopicSessions = recentSessions
                .filter((s) => s.topic === moduleTopicId)
                .sort((a, b) => a.chapterNumber - b.chapterNumber);
              const completedChapterNumbers = new Set(
                activeTopicSessions.filter((s) => s.completedAt).map((s) => s.chapterNumber)
              );
              const activeChapterNumber = latestSession?.topic === moduleTopicId
                ? latestSession.chapterNumber
                : (activeTopicSessions[activeTopicSessions.length - 1]?.chapterNumber ?? 1);
              const totalModules = Math.max(recommendedTopic.theoryTotal, activeChapterNumber);
              const chapterTitleMap = new Map(
                activeTopicSessions.map((s) => [s.chapterNumber, s.chapterId.replace(/^module-/, 'Module ')])
              );

              // Only show previous, current, and next module
              const visibleRange = [activeChapterNumber - 1, activeChapterNumber, activeChapterNumber + 1]
                .filter((n) => n >= 1 && n <= totalModules);

              return visibleRange.map((num) => {
                const isCompleted = completedChapterNumbers.has(num);
                const isActive = num === activeChapterNumber && !isCompleted;
                const isLocked = num > activeChapterNumber && !isCompleted;
                const session = activeTopicSessions.find((s) => s.chapterNumber === num);
                const title = session
                  ? session.chapterId.replace(/^module-\d+-?/, '').replace(/-/g, ' ') || `Chapter ${num}`
                  : `Chapter ${num}`;
                const progressBars = session && !isCompleted
                  ? Math.round((session.sectionsRead / Math.max(1, session.sectionsTotal)) * 4)
                  : 0;

                return (
                  <Link
                    key={num}
                    href={`/learn/${moduleTopicId}/theory`}
                    className="relative flex items-center gap-3 group"
                  >
                    <div className={`z-10 w-8 h-8 border flex items-center justify-center flex-shrink-0 ${
                      isCompleted
                        ? 'border-primary/40 bg-primary/10'
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
                      <p className={`text-[9px] font-mono mb-0.5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        M-{String(num).padStart(2, '0')}{isActive ? ' [ACTIVE]' : ''}
                      </p>
                      <h4 className={`text-xs font-bold uppercase tracking-wide leading-tight ${
                        isActive ? 'font-headline text-primary' : 'font-mono text-on-surface/60'
                      }`}>
                        {title}
                      </h4>
                      {isCompleted && (
                        <span className="text-[7px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 mt-1 inline-block">SYNCED</span>
                      )}
                      {isActive && !isCompleted && (
                        <div className="flex gap-1 mt-1.5">
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
          <div className="absolute top-5 left-5 border-l border-t border-primary/30 w-12 h-12" />
          <div className="absolute top-5 right-5 border-r border-t border-primary/30 w-12 h-12" />
          <div className="absolute bottom-5 left-5 border-l border-b border-primary/30 w-12 h-12" />
          <div className="absolute bottom-5 right-5 border-r border-b border-primary/30 w-12 h-12" />

          {/* Scanning HUD */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-primary/10 rounded-full animate-pulse" />
            <div className="absolute top-[20%] left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>

          <div className="relative z-10 text-center">
            <div className="mb-4">
              <span className="font-mono text-[9px] text-primary/60 tracking-[0.5em] uppercase">AVATAR_SYNC_PORT</span>
            </div>

            {/* Operator avatar */}
            <div className="relative w-64 h-80 bg-primary/5 border border-primary/20 flex items-center justify-center overflow-hidden group mb-4">
              <Image
                src="/grid-assets/operator-avatar.jpg"
                alt={`Operator ${firstName}`}
                fill
                className="object-cover grayscale brightness-125 contrast-125"
                unoptimized
              />
              {/* HUD overlays on image */}
              <div className="absolute bottom-3 left-3 text-left z-10">
                <div className="text-[8px] font-mono text-primary bg-surface-dim/80 px-1 border-l-2 border-primary mb-0.5">BIOMETRICS: NOMINAL</div>
                <div className="text-[8px] font-mono text-primary bg-surface-dim/80 px-1 border-l-2 border-primary">NEURAL_LOAD: {overallProgress}%</div>
              </div>
              <div className="absolute top-3 right-3 text-right z-10">
                <div className="text-[8px] font-mono text-primary/60">OP_ID: OP-01</div>
                <div className="text-[8px] font-mono text-primary/60">LOC: SECTOR_G7</div>
              </div>
            </div>

            <h2 className="font-headline text-lg font-black text-on-surface tracking-widest uppercase">
              OPERATOR {firstName.toUpperCase()}
            </h2>
            <p className="font-mono text-[9px] text-primary mt-1">LINK_ESTABLISHED_SUCCESSFULLY</p>
          </div>

          {/* Bottom HUD stats */}
          <div className="absolute bottom-5 w-full px-10 flex justify-between items-end">
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
        <section className="lg:col-span-3 overflow-y-auto p-5 bg-surface-dim/40 border-l border-outline-variant/20">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-headline font-bold text-sm tracking-widest text-primary">MISSION_BRIEFING</h3>
            <span className="font-mono text-[9px] text-tertiary">[{topicSnapshots.filter(s => s.theoryPct > 0 && s.theoryPct < 100).length} ACTIVE]</span>
          </div>
          <div className="space-y-4">
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
            <div className="mt-8 p-3 glass-panel border-dashed">
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
      <footer className="h-9 border-t border-outline-variant/20 flex items-center justify-between px-5 bg-surface-dim flex-shrink-0">
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
