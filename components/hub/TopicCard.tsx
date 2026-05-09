'use client';

import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { TopicInfo } from '@/lib/types';
import { useProgressStore } from '@/lib/stores/useProgressStore';

interface TopicCardProps {
  topic: TopicInfo;
  index?: number;
}

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
  const completed = completion >= 100;
  const active = progress.total > 0 && !completed;

  return (
    <Link
      href={`/practice/${topic.id}`}
      aria-label={`Start ${topic.name} practice`}
      className="card card-hover flex flex-col gap-4 p-5"
      style={{ transitionDelay: `${Math.min(index, 8) * 28}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 pr-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-surface-dim bg-surface-container-low text-2xl">
            {topic.icon}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-on-surface">
              {topic.name}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {topic.description}
            </p>
          </div>
        </div>

        {completed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-success-300 bg-success-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-success-700">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        ) : active ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-primary-fixed bg-primary-fixed px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-on-surface-variant">
            New
          </span>
        )}
      </div>

      <div className="mt-auto border-t border-surface-dim/80 pt-3">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-on-surface-variant">
          <span>Completion</span>
          <span>{completion}%</span>
        </div>
        <div className="w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
          <div style={{ width: `${completion}%`, height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
        </div>
      </div>
    </Link>
  );
}
