'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { User } from '@supabase/supabase-js';
import type { ReadingSession, TopicProgress } from '@/types/progress';
import { ContinueReading } from '@/components/home/home/ContinueReading';
import { DailyPracticeCard } from '@/components/home/home/DailyPracticeCard';
import { HomeHeroHeader } from '@/components/home/home/HomeHeroHeader';
import { WeeklyActivityCard } from '@/components/home/home/WeeklyActivityCard';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { HOME_TOPIC_ORDER, getHomeTopicMeta } from '@/components/home/home/topicMeta';

interface HomeDashboardProps {
  user: User;
  topicProgress: TopicProgress[];
  recentSessions: ReadingSession[];
  readingHistory: ReadingSession[];
  stats: {
    totalXp: number;
    currentStreak: number;
    questionsCompleted: number;
    overallAccuracy: number;
  };
}

export const HomeDashboard = ({
  user,
  topicProgress,
  recentSessions,
  readingHistory,
  stats
}: HomeDashboardProps) => {
  const questionHistory = useProgressStore((state) => state.questionHistory);
  const dailyEnergy = useProgressStore((state) => state.dailyXP);

  const firstName =
    user.user_metadata?.name?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'there';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const questionsToday = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return questionHistory.filter(
      (entry) => format(new Date(entry.timestamp), 'yyyy-MM-dd') === today
    ).length;
  }, [questionHistory]);

  const energyTodayUnits = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return dailyEnergy[today] ?? 0;
  }, [dailyEnergy]);

  const chaptersCompleted = useMemo(
    () =>
      topicProgress.reduce(
        (sum, topic) => sum + (topic.theoryChaptersCompleted ?? 0),
        0
      ),
    [topicProgress]
  );

  const overallProgress = useMemo(() => {
    const topicMap = new Map(topicProgress.map((topic) => [topic.topic, topic]));
    const completedReadingByTopic = readingHistory
      .filter((session) => session.isCompleted)
      .reduce<Record<string, number>>((acc, session) => {
        acc[session.topic] = (acc[session.topic] ?? 0) + 1;
        return acc;
      }, {});

    const chapterTotals = HOME_TOPIC_ORDER.reduce((sum, topicId) => {
      const dbTotal = topicMap.get(topicId)?.theoryChaptersTotal ?? 0;
      const fallbackTotal = getHomeTopicMeta(topicId).fallbackChapters;
      return sum + (dbTotal > 0 ? dbTotal : fallbackTotal);
    }, 0);

    const chapterCompleted = HOME_TOPIC_ORDER.reduce((sum, topicId) => {
      const dbCompleted = topicMap.get(topicId)?.theoryChaptersCompleted ?? 0;
      const fallbackCompleted = completedReadingByTopic[topicId] ?? 0;
      return sum + Math.max(dbCompleted, fallbackCompleted);
    }, 0);

    const practiceTotals = HOME_TOPIC_ORDER.reduce((sum, topicId) => {
      const dbTotal = topicMap.get(topicId)?.practiceQuestionsTotal ?? 0;
      const fallbackTotal = getHomeTopicMeta(topicId).fallbackQuestions;
      return sum + (dbTotal > 0 ? dbTotal : fallbackTotal);
    }, 0);

    const dbAttempted = HOME_TOPIC_ORDER.reduce((sum, topicId) => {
      return sum + (topicMap.get(topicId)?.practiceQuestionsAttempted ?? 0);
    }, 0);
    const practiceAttempted = Math.max(dbAttempted, stats.questionsCompleted ?? 0);

    const theoryPct = chapterTotals > 0 ? (chapterCompleted / chapterTotals) * 100 : 0;
    const practicePct = practiceTotals > 0 ? (practiceAttempted / practiceTotals) * 100 : 0;

    const combined = Math.round((theoryPct + practicePct) / 2);
    return Math.max(0, Math.min(100, combined));
  }, [readingHistory, stats.questionsCompleted, topicProgress]);

  const hasInProgress = recentSessions.length > 0;
  return (
    <div className="min-h-screen bg-neutral-50 pb-24 dark:bg-neutral-950 lg:pb-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <HomeHeroHeader
          firstName={firstName}
          greeting={greeting}
          streak={stats.currentStreak}
          totalEnergyUnits={stats.totalXp}
          energyTodayUnits={energyTodayUnits}
          questionsCompleted={stats.questionsCompleted}
          overallAccuracy={stats.overallAccuracy}
          chaptersCompleted={chaptersCompleted}
          overallProgress={overallProgress}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-5">
            {hasInProgress ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
              >
                <ContinueReading sessions={recentSessions} />
              </motion.div>
            ) : null}
          </div>

          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.4 }}
            >
              <DailyPracticeCard
                questionsToday={questionsToday}
                goalPerDay={10}
                topicProgress={topicProgress}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.4 }}
            >
              <WeeklyActivityCard readingHistory={readingHistory} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
