'use client';

import { useMemo } from 'react';
import {
  addDays,
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays
} from 'date-fns';
import questionsIndex from '@/data/questions/index.json';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { PracticeTopic } from '@/lib/types';

export type DashboardPeriod = 'all' | 'week' | 'month' | 'year';

export interface DashboardStats {
  totalXP: number;
  currentStreak: number;
  totalQuestions: number;
  overallAccuracy: number;
  questionsInPeriod: number;
  xpInPeriod: number;
}

export interface TopicProgress {
  topic: string;
  correct: number;
  attempted: number;
  total: number;
  accuracy: number;
  completion: number;
  lastAttempted?: Date;
}

export interface CompletionDataPoint {
  date: string;
  completed: number;
}

export interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface RecentQuestion {
  id: string;
  topic: string;
  question: string;
  correct: boolean;
  attemptedAt: Date;
}

type QuestionLookup = Record<
  string,
  { question: string; topic: PracticeTopic }
>;

const buildQuestionLookup = () => {
  const lookup: QuestionLookup = {};
  const questionGroups = questionsIndex.questions ?? {};
  Object.entries(questionGroups).forEach(([topic, questions]) => {
    (questions as Array<{ id: string; question: string }>).forEach((item) => {
      lookup[item.id] = {
        question: item.question,
        topic: topic as PracticeTopic
      };
    });
  });
  return lookup;
};

const QUESTION_LOOKUP = buildQuestionLookup();
const TOPIC_TOTALS = questionsIndex.topics as Record<
  PracticeTopic,
  { totalQuestions: number }
>;

const getPeriodStart = (period: DashboardPeriod, now: Date) => {
  if (period === 'week') {
    return startOfWeek(now, { weekStartsOn: 0 });
  }
  if (period === 'month') {
    return startOfMonth(now);
  }
  if (period === 'year') {
    return startOfYear(now);
  }
  return null;
};

const sumValues = (values: Record<string, number>) =>
  Object.values(values).reduce((sum, value) => sum + value, 0);

const getLevel = (count: number): ActivityDay['level'] => {
  if (count <= 0) return 0;
  if (count < 3) return 1;
  if (count < 6) return 2;
  if (count < 10) return 3;
  return 4;
};

export const useDashboardData = (period: DashboardPeriod = 'all') => {
  const {
    xp,
    streak,
    completedQuestions,
    topicProgress,
    dailyXP,
    dailyQuestions,
    questionHistory
  } = useProgressStore();

  const periodStart = useMemo(
    () => getPeriodStart(period, new Date()),
    [period]
  );
  const periodStartKey = periodStart ? format(periodStart, 'yyyy-MM-dd') : null;

  const hasLifetimeProgress = useMemo(() => {
    if (questionHistory.length > 0 || completedQuestions.length > 0) {
      return true;
    }
    return Object.values(topicProgress).some((topic) => topic.total > 0);
  }, [completedQuestions.length, questionHistory.length, topicProgress]);

  const historyByDay = useMemo(() => {
    const xpByDay: Record<string, number> = {};
    const questionsByDay: Record<string, number> = {};

    questionHistory.forEach((entry) => {
      const dayKey = format(new Date(entry.timestamp), 'yyyy-MM-dd');
      xpByDay[dayKey] = (xpByDay[dayKey] ?? 0) + entry.xp;
      questionsByDay[dayKey] = (questionsByDay[dayKey] ?? 0) + 1;
    });

    return { xpByDay, questionsByDay };
  }, [questionHistory]);

  const mergedDailyXP = useMemo(() => {
    const merged: Record<string, number> = { ...historyByDay.xpByDay };
    Object.entries(dailyXP).forEach(([key, value]) => {
      merged[key] = (merged[key] ?? 0) + value;
    });

    if (Object.keys(merged).length === 0 && xp > 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      merged[today] = xp;
    }

    return merged;
  }, [dailyXP, historyByDay.xpByDay, xp]);

  const periodDailyXP = useMemo(() => {
    if (!periodStartKey) {
      return mergedDailyXP;
    }
    const filtered: Record<string, number> = {};
    Object.entries(mergedDailyXP).forEach(([key, value]) => {
      if (key >= periodStartKey) {
        filtered[key] = value;
      }
    });
    return filtered;
  }, [mergedDailyXP, periodStartKey]);

  const mergedDailyQuestions = useMemo(() => {
    const merged: Record<string, number> = { ...historyByDay.questionsByDay };
    Object.entries(dailyQuestions).forEach(([key, value]) => {
      merged[key] = (merged[key] ?? 0) + value;
    });
    return merged;
  }, [dailyQuestions, historyByDay.questionsByDay]);

  const periodDailyQuestions = useMemo(() => {
    if (!periodStartKey) {
      return mergedDailyQuestions;
    }
    const filtered: Record<string, number> = {};
    Object.entries(mergedDailyQuestions).forEach(([key, value]) => {
      if (key >= periodStartKey) {
        filtered[key] = value;
      }
    });
    return filtered;
  }, [mergedDailyQuestions, periodStartKey]);

  const periodHistory = useMemo(() => {
    if (!periodStart) {
      return questionHistory;
    }
    const startTimestamp = periodStart.getTime();
    return questionHistory.filter((entry) => entry.timestamp >= startTimestamp);
  }, [periodStart, questionHistory]);

  const questionOutcomes = useMemo(() => {
    const outcomes = new Map<string, { topic: PracticeTopic; correct: boolean }>();
    periodHistory.forEach((entry) => {
      const existing = outcomes.get(entry.questionId);
      if (existing) {
        existing.correct = existing.correct || entry.correct;
        return;
      }
      outcomes.set(entry.questionId, { topic: entry.topic, correct: entry.correct });
    });
    return outcomes;
  }, [periodHistory]);

  const stats: DashboardStats = useMemo(() => {
    const totalXPInPeriod = sumValues(periodDailyXP);
    let totalQuestions = questionOutcomes.size;
    let totalCorrect = 0;
    questionOutcomes.forEach((value) => {
      if (value.correct) {
        totalCorrect += 1;
      }
    });

    if (totalQuestions === 0 && period === 'all' && questionHistory.length === 0) {
      totalQuestions = Object.values(topicProgress).reduce(
        (sum, topic) => sum + topic.total,
        0
      );
      totalCorrect = Object.values(topicProgress).reduce(
        (sum, topic) => sum + topic.correct,
        0
      );
    }

    const overallAccuracy =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const totalXP = period === 'all' ? (totalXPInPeriod || xp) : totalXPInPeriod;

    return {
      totalXP,
      currentStreak: streak,
      totalQuestions,
      overallAccuracy,
      questionsInPeriod: totalQuestions,
      xpInPeriod: totalXPInPeriod
    };
  }, [
    period,
    periodDailyXP,
    questionOutcomes,
    questionHistory.length,
    topicProgress,
    xp,
    streak
  ]);

  const topics: TopicProgress[] = useMemo(() => {
    const topicOrder = Object.keys(TOPIC_TOTALS) as PracticeTopic[];
    const topicQuestionMap = new Map<
      PracticeTopic,
      Map<string, { correct: boolean; attemptedAt: number }>
    >();

    periodHistory.forEach((entry) => {
      const currentTopicMap =
        topicQuestionMap.get(entry.topic) ??
        new Map<string, { correct: boolean; attemptedAt: number }>();
      const existing = currentTopicMap.get(entry.questionId);
      if (existing) {
        existing.correct = existing.correct || entry.correct;
        existing.attemptedAt = Math.max(existing.attemptedAt, entry.timestamp);
      } else {
        currentTopicMap.set(entry.questionId, {
          correct: entry.correct,
          attemptedAt: entry.timestamp
        });
      }
      topicQuestionMap.set(entry.topic, currentTopicMap);
    });

    return topicOrder.map((topic) => {
      const total = TOPIC_TOTALS[topic]?.totalQuestions ?? 0;
      const perTopic = topicQuestionMap.get(topic);
      const attempted = perTopic?.size ?? 0;
      let correct = 0;
      let lastAttempted: Date | undefined;

      if (perTopic && perTopic.size > 0) {
        perTopic.forEach((value) => {
          if (value.correct) {
            correct += 1;
          }
          if (!lastAttempted || value.attemptedAt > lastAttempted.getTime()) {
            lastAttempted = new Date(value.attemptedAt);
          }
        });
      } else if (period === 'all' && questionHistory.length === 0) {
        const fallback = topicProgress[topic];
        correct = fallback?.correct ?? 0;
        const fallbackAttempted = fallback?.total ?? 0;
        lastAttempted = fallback?.lastAttempted
          ? parseISO(fallback.lastAttempted)
          : undefined;
        return {
          topic,
          correct,
          attempted: fallbackAttempted,
          total,
          accuracy:
            fallbackAttempted > 0
              ? Math.round((correct / fallbackAttempted) * 100)
              : 0,
          completion:
            total > 0
              ? Math.round((fallbackAttempted / total) * 100)
              : 0,
          lastAttempted
        };
      }

      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const completion = total > 0 ? Math.round((attempted / total) * 100) : 0;

      return {
        topic,
        correct,
        attempted,
        total,
        accuracy,
        completion,
        lastAttempted
      };
    });
  }, [period, periodHistory, questionHistory.length, topicProgress]);

  const completionChartData: CompletionDataPoint[] = useMemo(() => {
    const now = new Date();
    const points: CompletionDataPoint[] = [];

    if (period === 'week') {
      const start = startOfWeek(now, { weekStartsOn: 0 });
      for (let i = 0; i < 7; i += 1) {
        const date = addDays(start, i);
        const key = format(date, 'yyyy-MM-dd');
        points.push({
          date: format(date, 'EEE'),
          completed: periodDailyQuestions[key] ?? 0
        });
      }
      return points;
    }

    if (period === 'month') {
      const start = startOfMonth(now);
      const dates = eachDayOfInterval({ start, end: now });
      dates.forEach((date) => {
        const key = format(date, 'yyyy-MM-dd');
        points.push({ date: format(date, 'd'), completed: periodDailyQuestions[key] ?? 0 });
      });
      return points;
    }

    if (period === 'year') {
      for (let month = 0; month < 12; month += 1) {
        const date = new Date(now.getFullYear(), month, 1);
        const monthKey = format(date, 'yyyy-MM');
        const completedInMonth = Object.entries(periodDailyQuestions).reduce(
          (sum, [key, value]) => {
            if (key.startsWith(monthKey)) {
              return sum + value;
            }
            return sum;
          },
          0
        );
        points.push({ date: format(date, 'MMM'), completed: completedInMonth });
      }
      return points;
    }

    const monthTotals: Record<string, number> = {};
    Object.entries(periodDailyQuestions).forEach(([key, value]) => {
      const monthKey = key.slice(0, 7);
      monthTotals[monthKey] = (monthTotals[monthKey] ?? 0) + value;
    });
    const sortedMonths = Object.keys(monthTotals).sort();
    if (sortedMonths.length === 0) {
      const currentMonth = format(now, 'yyyy-MM');
      return [
        {
          date: format(parseISO(`${currentMonth}-01`), 'MMM yy'),
          completed: 0
        }
      ];
    }
    return sortedMonths.map((monthKey) => ({
      date: format(parseISO(`${monthKey}-01`), 'MMM yy'),
      completed: monthTotals[monthKey]
    }));
  }, [period, periodDailyQuestions]);

  const activityData: ActivityDay[] = useMemo(() => {
    const now = new Date();
    let start: Date;

    if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 0 });
    } else if (period === 'month') {
      start = startOfMonth(now);
    } else if (period === 'year') {
      start = startOfYear(now);
    } else {
      const firstDay = Object.keys(periodDailyQuestions).sort()[0];
      start = firstDay ? parseISO(firstDay) : subDays(now, 89);
    }

    const dates = eachDayOfInterval({ start, end: now });
    return dates.map((date) => {
      const key = format(date, 'yyyy-MM-dd');
      const count = mergedDailyQuestions[key] ?? 0;
      return {
        date: key,
        count,
        level: getLevel(count)
      };
    });
  }, [mergedDailyQuestions, period, periodDailyQuestions]);

  const recentQuestions: RecentQuestion[] = useMemo(() => {
    if (periodHistory.length > 0) {
      return [...periodHistory]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10)
        .map((entry) => {
          const lookup = QUESTION_LOOKUP[entry.questionId];
          return {
            id: entry.questionId,
            topic: lookup?.topic ?? entry.topic,
            question: lookup?.question ?? `Question ${entry.questionId}`,
            correct: entry.correct,
            attemptedAt: new Date(entry.timestamp)
          };
        });
    }

    if (period !== 'all') {
      return [];
    }

    return completedQuestions.slice(-10).reverse().map((id, index) => {
      const lookup = QUESTION_LOOKUP[id];
      return {
        id,
        topic: lookup?.topic ?? 'sql',
        question: lookup?.question ?? `Question ${id}`,
        correct: true,
        attemptedAt: subDays(new Date(), index)
      };
    });
  }, [completedQuestions, period, periodHistory]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const todayQuestions = mergedDailyQuestions[todayKey] ?? 0;

  const insights = useMemo(() => {
    const activeTopics = topics.filter((topic) => topic.attempted > 0);
    const weakTopic =
      activeTopics.length > 0
        ? activeTopics.reduce(
            (min, topic) => (topic.accuracy < min.accuracy ? topic : min),
            activeTopics[0]
          )
        : undefined;
    const strongTopic =
      activeTopics.length > 0
        ? activeTopics.reduce(
            (max, topic) => (topic.accuracy > max.accuracy ? topic : max),
            activeTopics[0]
          )
        : undefined;

    return {
      weakTopic: weakTopic?.topic,
      weakAccuracy: weakTopic?.accuracy,
      strongTopic: strongTopic?.topic,
      strongAccuracy: strongTopic?.accuracy,
      needsMorePractice: period === 'all' && stats.totalQuestions < 50,
      streakAtRisk: streak > 0 && todayQuestions === 0
    };
  }, [period, stats, streak, todayQuestions, topics]);

  const hasPeriodData =
    stats.totalQuestions > 0 || stats.totalXP > 0 || recentQuestions.length > 0;

  return {
    stats,
    topics,
    completionChartData,
    activityData,
    recentQuestions,
    insights,
    hasLifetimeProgress,
    hasPeriodData
  };
};
