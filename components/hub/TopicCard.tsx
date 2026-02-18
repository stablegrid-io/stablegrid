'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { TopicInfo } from '@/lib/types';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface TopicCardProps {
  topic: TopicInfo;
  index?: number;
}

const MONO_ACCENT = {
  accentColor: '#10b981',
  accentRgb: '16,185,129'
};

export function TopicCard({ topic, index = 0 }: TopicCardProps) {
  const { topicProgress } = useProgressStore();
  const progress = topicProgress[topic.id] ?? {
    correct: 0,
    total: 0,
    lastAttempted: null
  };
  const rawCompletion = topic.totalQuestions
    ? Math.round((progress.total / topic.totalQuestions) * 100)
    : 0;
  const completion = Math.min(rawCompletion, 100);
  const accuracy = progress.total
    ? Math.round((progress.correct / progress.total) * 100)
    : 0;
  const completed = completion >= 100;
  const active = progress.total > 0 && !completed;
  const meta = MONO_ACCENT;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-light-border/90 bg-light-surface text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/5 dark:border-dark-border dark:bg-[#0a1019] dark:hover:shadow-black/30"
      style={{
        borderColor: `rgba(${meta.accentRgb}, 0.22)`,
        transitionDelay: `${Math.min(index, 8) * 28}ms`
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(140deg, rgba(255,255,255,0.98), rgba(248,250,255,0.96) 65%), radial-gradient(circle at top right, rgba(' +
            meta.accentRgb +
            ', 0.16), transparent 58%)'
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 hidden dark:block"
        style={{
          background:
            'linear-gradient(145deg, rgba(8,12,20,0.96), rgba(7,10,16,0.95) 70%), radial-gradient(circle at top right, rgba(' +
            meta.accentRgb +
            ', 0.24), transparent 60%)'
        }}
      />

      <Link
        href={`/practice/${topic.id}`}
        aria-label={`Start ${topic.name} practice`}
        className="group relative flex h-full flex-col gap-4 p-5"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 pr-2">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl border text-2xl"
              style={{
                borderColor: `rgba(${meta.accentRgb}, 0.28)`,
                backgroundColor: `rgba(${meta.accentRgb}, 0.12)`
              }}
            >
              {topic.icon}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-text-light-primary dark:text-[#f5f8ff]">
                {topic.name}
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-[#9bb1c7]">
                {topic.description}
              </p>
            </div>
          </div>

          {completed ? (
            <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300"
              style={{
                borderColor: `rgba(${meta.accentRgb}, 0.35)`,
                backgroundColor: `rgba(${meta.accentRgb}, 0.12)`
              }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Done
            </span>
          ) : active ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{
                borderColor: `rgba(${meta.accentRgb}, 0.35)`,
                backgroundColor: `rgba(${meta.accentRgb}, 0.12)`,
                color: meta.accentColor
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: meta.accentColor }}
              />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
              New
            </span>
          )}
        </div>

        <div className="mt-auto border-t border-light-border/80 pt-3 dark:border-dark-border">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
            <span>Completion</span>
            <span>{completion}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-light-border dark:bg-dark-border">
            <div
              className="h-1.5 rounded-full bg-brand-500"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}
