'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, Zap, Clock, BookOpen } from 'lucide-react';
import type { ReadingSession, Topic, TopicProgress } from '@/types/progress';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';
import type { TrackMetaByTopic } from '@/lib/learn/theoryTrackMeta';

/* ── Types ── */

interface ProgressDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  allSessions: ReadingSession[];
  trackMetaByTopic: TrackMetaByTopic;
  stats: { totalXp: number; currentStreak: number; questionsCompleted: number };
}

/* ── Topic icon map ── */

const TOPIC_ICON: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg', fabric: '/brand/microsoft-fabric-track.svg',
  airflow: '/brand/apache-airflow-logo.svg', sql: '/brand/sql-logo.svg',
  'python-de': '/brand/python-logo.svg', kafka: '/brand/apache-kafka-logo.svg',
  docker: '/brand/docker-logo.svg', dbt: '/brand/dbt-logo.svg',
  databricks: '/brand/databricks-logo.svg', 'cloud-infra': '/brand/cloud-infra-logo.svg',
  flink: '/brand/apache-flink-logo.svg', iceberg: '/brand/apache-iceberg-logo.svg',
  terraform: '/brand/terraform-logo.svg', snowflake: '/brand/snowflake-logo.svg',
  'data-modeling': '/brand/data-modeling-logo.svg', 'data-quality': '/brand/data-quality-logo.svg',
  governance: '/brand/governance-logo.svg', 'git-cicd': '/brand/git-logo.svg',
  'spark-streaming': '/brand/spark-streaming-logo.svg',
};

/* ── Helpers ── */

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function getDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/* ── Component ── */

export function ProgressDashboard({
  user, topicProgress, allSessions, trackMetaByTopic, stats,
}: ProgressDashboardProps) {

  /* ── Topic snapshots ── */
  const topicSnapshots = useMemo(() => {
    return HOME_TOPIC_ORDER.map((topicId) => {
      const progress = topicProgress.find((p) => p.topic === topicId);
      const meta = getHomeTopicMeta(topicId as Topic);
      const style = getTheoryTopicStyle(topicId);
      const total = progress?.theoryChaptersTotal ?? 0;
      const completed = progress?.theoryChaptersCompleted ?? 0;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { topicId, label: meta?.label ?? topicId, pct, completed, total, accentRgb: style.accentRgb };
    }).filter((s) => s.total > 0);
  }, [topicProgress]);

  /* ── Overall stats ── */
  const overallPct = useMemo(() => {
    const total = topicSnapshots.reduce((s, t) => s + t.total, 0);
    const done = topicSnapshots.reduce((s, t) => s + t.completed, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [topicSnapshots]);

  /* ── Session counts by type ── */
  const sessionCounts = useMemo(() => {
    let sprint = 0, pomodoro = 0, deepFocus = 0;
    const completed = allSessions.filter((s) => s.isCompleted);
    for (const s of completed) {
      if (s.activeSeconds <= 900) sprint++;
      else if (s.activeSeconds <= 2700) pomodoro++;
      else deepFocus++;
    }
    return { sprint, pomodoro, deepFocus, total: completed.length };
  }, [allSessions]);

  const totalModulesDone = topicSnapshots.reduce((s, t) => s + t.completed, 0);
  const totalModules = topicSnapshots.reduce((s, t) => s + t.total, 0);

  /* ── Heatmap: 12 weeks × 7 days ── */
  /* Counts lessons read per day — each section/lesson completed counts as 1 unit */
  const heatmapData = useMemo(() => {
    const now = new Date();
    const dayMap = new Map<string, number>();

    allSessions.forEach((s) => {
      const key = getDayKey(new Date(s.lastActiveAt));
      // Count lessons read in this session (sectionsRead), minimum 1 if session exists
      const lessonsInSession = Math.max(s.sectionsRead, 1);
      dayMap.set(key, (dayMap.get(key) ?? 0) + lessonsInSession);
    });

    const weeks: Array<Array<{ key: string; count: number; label: string }>> = [];
    // End on today, align to the current week's Monday, then go back 11 more weeks
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayDay = today.getDay();
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - ((todayDay + 6) % 7));
    const startDate = new Date(thisMonday);
    startDate.setDate(startDate.getDate() - 11 * 7); // 11 weeks back from this Monday

    for (let w = 0; w < 12; w++) {
      const week: Array<{ key: string; count: number; label: string }> = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + w * 7 + d);
        const key = getDayKey(date);
        const isFuture = date > now;
        week.push({
          key,
          count: isFuture ? -1 : (dayMap.get(key) ?? 0),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        });
      }
      weeks.push(week);
    }
    return weeks;
  }, [allSessions]);

  const maxActivity = useMemo(() => {
    let max = 1;
    heatmapData.forEach((week) => week.forEach((day) => { if (day.count > max) max = day.count; }));
    return max;
  }, [heatmapData]);

  /* ── Weekly velocity (last 8 weeks) ── */
  const weeklyVelocity = useMemo(() => {
    const weekMap = new Map<string, number>();
    allSessions.forEach((s) => {
      if (s.isCompleted) {
        const wk = getWeekKey(new Date(s.completedAt ?? s.lastActiveAt));
        weekMap.set(wk, (weekMap.get(wk) ?? 0) + 1);
      }
    });

    const weeks: Array<{ key: string; count: number }> = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const key = getWeekKey(d);
      weeks.push({ key, count: weekMap.get(key) ?? 0 });
    }
    return weeks;
  }, [allSessions]);

  const maxVelocity = Math.max(...weeklyVelocity.map((w) => w.count), 1);

  /* ── Track level grid ── */
  const trackGrid = useMemo(() => {
    // Build a set of all completed chapter IDs across topics from topicProgress
    const completedModuleIds = new Set<string>();
    topicProgress.forEach((tp) => {
      // A chapter is "completed" if sectionsRead >= sectionsTotal (all lessons read)
      // We don't have per-chapter data here, so use theoryChaptersCompleted as the count
      // and rely on trackMetaByTopic.moduleIds to map which modules are in which track
    });

    return topicSnapshots.map((topic) => {
      const tracks = (trackMetaByTopic as Record<string, Array<{ slug: string; moduleCount: number; moduleIds: string[] }>>)[topic.topicId] ?? [];
      // Distribute completed count sequentially across tracks (modules are ordered)
      let remaining = topic.completed;
      const levels = ['junior', 'mid', 'senior'].map((slug) => {
        const track = tracks.find((t) => t.slug === slug);
        if (!track || track.moduleCount === 0) return { slug, status: 'empty' as const };
        const trackCompleted = Math.min(track.moduleCount, remaining);
        remaining = Math.max(0, remaining - track.moduleCount);
        const pct = Math.round((trackCompleted / track.moduleCount) * 100);
        if (pct >= 100) return { slug, status: 'complete' as const };
        if (pct > 0) return { slug, status: 'progress' as const };
        return { slug, status: 'available' as const };
      });
      return { ...topic, levels };
    });
  }, [topicSnapshots, trackMetaByTopic, topicProgress]);

  /* ── Total sessions + time ── */
  const totalSessions = allSessions.length;
  const totalMinutes = Math.round(allSessions.reduce((s, sess) => s + sess.activeSeconds, 0) / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  return (
    <div className="min-h-screen pb-24 lg:pb-10">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12 space-y-10">

        <Link
          href="/home"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        {/* ── Header ── */}
        <div className="border-l-2 border-primary pl-6" style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}>
          <h1 className="text-5xl font-extrabold tracking-tighter text-on-surface uppercase">
            Progress <span className="text-primary">Check</span>
          </h1>
        </div>

        {/* ── Key metrics ── */}
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 80ms forwards' }}
        >
          <MetricCard label="Modules" value={`${totalModulesDone}/${totalModules}`} sub={`${overallPct}% complete`} rgb="153,247,255" />
          <MetricCard label="Time Invested" value={`${String(totalHours).padStart(2, '0')}:${String(remainingMins).padStart(2, '0')}`} sub={`${totalSessions} sessions`} rgb="191,129,255" />
          <MetricCard label="kWh" value={stats.totalXp.toLocaleString()} sub="total earned" rgb="255,201,101" />
          <MetricCard label="Streak" value={`${stats.currentStreak}`} sub={stats.currentStreak === 1 ? 'day' : 'days'} rgb="255,113,108" />
        </div>

        {/* ── Activity heatmap ── */}
        <section style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 160ms forwards' }}>
          <h2 className="text-[13px] font-medium text-on-surface-variant/50 mb-4">Activity</h2>
          <div className="rounded-[22px] bg-[#111416] border border-white/[0.06] p-5 overflow-x-auto">
            <div className="flex gap-[3px] min-w-[500px]">
              {heatmapData.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px] flex-1">
                  {week.map((day) => {
                    const isFuture = day.count < 0;
                    const intensity = isFuture ? 0 : day.count / maxActivity;
                    return (
                      <div
                        key={day.key}
                        className="aspect-square rounded-[2px] transition-colors"
                        title={isFuture ? '' : `${day.label}: ${day.count} lesson${day.count !== 1 ? 's' : ''} completed`}
                        style={{
                          backgroundColor: isFuture
                            ? 'rgba(255,255,255,0.01)'
                            : day.count === 0
                              ? 'rgba(255,255,255,0.03)'
                              : `rgba(153,247,255,${0.15 + intensity * 0.65})`,
                          boxShadow: day.count > 0 ? `0 0 ${Math.round(intensity * 4)}px rgba(153,247,255,${intensity * 0.3})` : 'none',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-[10px] text-on-surface-variant/25">
              <span>12 weeks ago</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                {[0, 0.2, 0.4, 0.7, 1].map((v, i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-[2px]"
                    style={{ backgroundColor: v === 0 ? 'rgba(255,255,255,0.03)' : `rgba(153,247,255,${0.15 + v * 0.65})` }}
                  />
                ))}
                <span>More</span>
              </div>
              <span>Now</span>
            </div>
          </div>
        </section>

        {/* ── Weekly velocity ── */}
        <section style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 240ms forwards' }}>
          <h2 className="text-[13px] font-medium text-on-surface-variant/50 mb-4">Modules completed per week</h2>
          <div className="rounded-[22px] bg-[#111416] border border-white/[0.06] p-5">
            <div className="flex items-end gap-2 h-24">
              {weeklyVelocity.map((week, i) => {
                const heightPct = maxVelocity > 0 ? (week.count / maxVelocity) * 100 : 0;
                const isCurrentWeek = i === weeklyVelocity.length - 1;
                return (
                  <div key={week.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                      <div
                        className="w-full max-w-[32px] rounded-t-[4px] transition-all duration-500"
                        style={{
                          height: `${Math.max(heightPct, 2)}%`,
                          backgroundColor: isCurrentWeek ? 'rgba(153,247,255,0.7)' : 'rgba(153,247,255,0.2)',
                          boxShadow: isCurrentWeek && week.count > 0 ? '0 0 8px rgba(153,247,255,0.3)' : 'none',
                        }}
                      />
                    </div>
                    {week.count > 0 && (
                      <span className="text-[9px] text-on-surface-variant/30">{week.count}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant/20">
              <span>8w ago</span>
              <span>This week</span>
            </div>
          </div>
        </section>

        {/* ── Track completion grid ── */}
        <section style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 320ms forwards' }}>
          <h2 className="text-[13px] font-medium text-on-surface-variant/50 mb-4">Track completion</h2>
          <div className="rounded-[22px] bg-[#111416] border border-white/[0.06] p-5">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_60px_60px_60px] gap-3 mb-3 px-1">
              <div />
              <span className="text-[10px] text-center text-on-surface-variant/30 uppercase tracking-widest">Jr</span>
              <span className="text-[10px] text-center text-on-surface-variant/30 uppercase tracking-widest">Mid</span>
              <span className="text-[10px] text-center text-on-surface-variant/30 uppercase tracking-widest">Sr</span>
            </div>

            <div className="space-y-1">
              {trackGrid.map((topic) => (
                <Link
                  key={topic.topicId}
                  href={`/learn/${topic.topicId}/theory`}
                  className="grid grid-cols-[1fr_60px_60px_60px] gap-3 items-center px-3 py-2.5 rounded-[14px] hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image
                      src={TOPIC_ICON[topic.topicId] ?? '/brand/pyspark-track-star.svg'}
                      alt={topic.label}
                      width={18}
                      height={18}
                      className="opacity-60 shrink-0"
                    />
                    <span className="text-[13px] font-medium text-on-surface/70 truncate">{topic.label}</span>
                  </div>
                  {topic.levels.map((level) => (
                    <div key={level.slug} className="flex justify-center">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{
                          backgroundColor:
                            level.status === 'complete' ? 'rgba(153,247,255,0.6)'
                            : level.status === 'progress' ? 'rgba(153,247,255,0.2)'
                            : level.status === 'available' ? 'rgba(255,255,255,0.04)'
                            : 'rgba(255,255,255,0.02)',
                          boxShadow: level.status === 'complete' ? '0 0 8px rgba(153,247,255,0.3)' : 'none',
                          border: level.status === 'empty' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        }}
                      />
                    </div>
                  ))}
                </Link>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04] text-[10px] text-on-surface-variant/25">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(153,247,255,0.6)' }} /> Complete</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(153,247,255,0.2)' }} /> In progress</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }} /> Available</span>
            </div>
          </div>
        </section>

        {/* ── Sessions ── */}
        <section style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) 400ms forwards' }}>
          <h2 className="text-[13px] font-medium text-on-surface-variant/50 mb-4">Sessions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { label: 'Sprint', count: sessionCounts.sprint, rgb: '153,247,255', icon: Zap },
              { label: 'Pomodoro', count: sessionCounts.pomodoro, rgb: '255,113,108', icon: Clock },
              { label: 'Deep Focus', count: sessionCounts.deepFocus, rgb: '191,129,255', icon: BookOpen },
              { label: 'Total', count: sessionCounts.total, rgb: '255,201,101', icon: BookOpen },
            ] as const).map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-[22px] bg-[#111416] border border-white/[0.06] p-5"
                  style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${450 + i * 60}ms forwards` }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <Icon size={16} style={{ color: `rgba(${item.rgb},0.7)` }} />
                    <span className="text-[10px] font-medium tracking-widest uppercase text-on-surface-variant/35">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabular-nums" style={{ color: `rgba(${item.rgb},0.85)` }}>
                    {item.count}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}

/* ── Metric Card ── */

function MetricCard({ label, value, sub, rgb }: { label: string; value: string; sub: string; rgb: string }) {
  return (
    <div
      className="rounded-[22px] bg-[#111416] border border-white/[0.06] p-5"
    >
      <p className="text-[10px] font-medium text-on-surface-variant/40 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-2xl font-bold tracking-tight" style={{ color: `rgb(${rgb})` }}>{value}</p>
      <p className="text-[11px] text-on-surface-variant/30 mt-1">{sub}</p>
    </div>
  );
}
