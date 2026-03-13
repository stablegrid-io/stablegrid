'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';
import { getTheoryTopicStyle } from '@/data/learn/theory/topicStyles';

type LearnMode = 'theory';

interface LearnModeTopicSelectorProps {
  mode: LearnMode;
  initialCompletedChapterCountByTopic?: Record<string, number>;
  initialChapterCountByTopic?: Record<string, number>;
}

interface TopicEntry {
  id: string;
  title: string;
  description: string;
  functionCount: number;
  chapterCount: number;
  chapterMinutes: number;
  workload: number;
  depth: 'starter' | 'standard' | 'deep';
}

const TRACK_ICON_SRC_BY_TOPIC: Record<string, string> = {
  pyspark: '/brand/pyspark-track-star.svg',
  fabric: '/brand/microsoft-fabric-track.svg'
};

const TRACK_LABEL = 'Track';

const getSimpleTrackName = (title: string) => {
  return title.replace(/\s+modules?$/i, '').trim();
};

export function LearnModeTopicSelector({
  mode,
  initialCompletedChapterCountByTopic = {},
  initialChapterCountByTopic = {}
}: LearnModeTopicSelectorProps) {
  const completedChapterCountByTopic = initialCompletedChapterCountByTopic;
  const chapterCountByTopic = initialChapterCountByTopic;

  const topics = useMemo<TopicEntry[]>(() => {
    return learnTopics.map((topic) => {
      const topicMeta = getLearnTopicMeta(topic.id);
      const workload = topic.chapterCount;

      return {
        ...topic,
        chapterMinutes: topicMeta?.chapterMinutes ?? 0,
        workload,
        depth: workload <= 3 ? 'starter' : workload <= 8 ? 'standard' : 'deep'
      };
    });
  }, []);

  const orderedTopics = useMemo(() => {
    return [...topics].sort((left, right) => {
      if (left.workload !== right.workload) {
        return right.workload - left.workload;
      }
      return left.title.localeCompare(right.title);
    });
  }, [topics]);

  return (
    <div className="min-h-screen bg-light-bg pb-20 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/learn"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All Topics
          </Link>

          <section>
            {orderedTopics.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                {orderedTopics.map((topic) => {
                  const trackIconSrc =
                    TRACK_ICON_SRC_BY_TOPIC[topic.id] ?? '/brand/pyspark-track-star.svg';
                  const style = getTheoryTopicStyle(topic.id);
                  const completedTopicChapters =
                    completedChapterCountByTopic[topic.id] ?? 0;
                  const totalTopicChapters =
                    chapterCountByTopic[topic.id] && chapterCountByTopic[topic.id] > 0
                      ? chapterCountByTopic[topic.id]
                      : topic.chapterCount;
                  const topicProgressPct =
                    totalTopicChapters > 0
                      ? Math.round((completedTopicChapters / totalTopicChapters) * 100)
                      : 0;

                  return (
                    <Link
                      key={`${mode}-${topic.id}`}
                      href={`/learn/${topic.id}/${mode}`}
                      className="group relative overflow-hidden rounded-[28px] border border-light-border bg-light-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--topic-accent),0.4)] hover:shadow-[0_24px_70px_-36px_rgba(var(--topic-accent),0.45)] dark:border-dark-border dark:bg-dark-surface"
                      style={{ '--topic-accent': style.accentRgb } as React.CSSProperties}
                    >
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 100% 0%, rgba(${style.accentRgb}, 0.18), transparent 34%), linear-gradient(180deg, rgba(${style.accentRgb}, 0.1), transparent 54%)`
                        }}
                      />
                      <div
                        className="pointer-events-none absolute -right-10 top-16 h-40 w-40 rounded-full blur-3xl"
                        style={{ backgroundColor: `rgba(${style.accentRgb}, 0.12)` }}
                      />

                      <div className="relative flex h-full flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <span
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${style.iconWrapClass}`}
                            >
                              <Image
                                src={trackIconSrc}
                                alt={`${getSimpleTrackName(topic.title)} logo`}
                                width={28}
                                height={28}
                                className="h-7 w-7 object-contain"
                              />
                            </span>

                            <div className="min-w-0">
                              <p
                                className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.accentTextClass}`}
                              >
                                {TRACK_LABEL}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="truncate text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                                  {getSimpleTrackName(topic.title)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                              {topicProgressPct}%
                            </div>
                            <div className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                              {completedTopicChapters}/{totalTopicChapters} read
                            </div>
                          </div>
                        </div>

                        <p className="mt-5 max-w-xl text-sm leading-7 text-text-light-secondary dark:text-text-dark-secondary">
                          {topic.description}
                        </p>

                        <div className="mt-6 border-t border-light-border/80 pt-5 dark:border-dark-border">
                          <div className="flex items-center gap-4">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-light-border dark:bg-dark-border">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${style.progressClass}`}
                                style={{ width: `${topicProgressPct}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                              {completedTopicChapters}/{totalTopicChapters}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center justify-end">
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-text-light-primary transition-transform group-hover:translate-x-0.5 dark:text-text-dark-primary">
                              Browse categories
                              <ChevronRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-light-border bg-light-surface p-8 text-center dark:border-dark-border dark:bg-dark-surface">
                <p className="text-base font-semibold text-text-light-primary dark:text-text-dark-primary">
                  No theory topics available yet
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
