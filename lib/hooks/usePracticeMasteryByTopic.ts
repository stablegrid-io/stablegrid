'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a map of `topicId → { solved, total, pct }` for the given language,
 * sourced from the existing `/api/operations/practice/mastery` endpoint.
 *
 * Used by the per-language coding gallery (`/practice/coding/[language]`) to
 * render per-topic progress bars on each card — the same treatment the Learn
 * topic selector uses for theory completion.
 *
 * Refetches on window focus so progress updates land without a hard reload
 * after the user finishes a task in another tab. Mirrors the refresh shape
 * used by `PracticeMasteryPanel` so the two panels stay in sync.
 */
export interface TopicMasteryEntry {
  solved: number;
  total: number;
  pct: number;
}

export type PracticeMasteryByTopic = Record<string, TopicMasteryEntry>;

interface RawTopicMastery {
  topicId: string;
  totalTasks: number;
  solvedTasks: number;
}

interface RawLanguageMastery {
  languageId: string;
  topics: RawTopicMastery[];
}

interface RawCategoryMastery {
  languages: RawLanguageMastery[];
}

interface MasteryResponse {
  data?: RawCategoryMastery[];
}

export function usePracticeMasteryByTopic(
  languageId: string,
): PracticeMasteryByTopic {
  const [byTopic, setByTopic] = useState<PracticeMasteryByTopic>({});

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const res = await fetch('/api/operations/practice/mastery', {
          credentials: 'same-origin',
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as MasteryResponse;
        if (cancelled) return;
        const next: PracticeMasteryByTopic = {};
        for (const cat of json.data ?? []) {
          for (const lang of cat.languages ?? []) {
            if (lang.languageId !== languageId) continue;
            for (const topic of lang.topics ?? []) {
              const total = Math.max(0, topic.totalTasks ?? 0);
              const solved = Math.max(0, Math.min(total, topic.solvedTasks ?? 0));
              const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
              next[topic.topicId] = { solved, total, pct };
            }
          }
        }
        setByTopic(next);
      } catch {
        // Swallow — the cards just render without a progress bar if the
        // endpoint is unavailable. Same fallback pattern as the mastery panel.
      }
    };
    void refresh();
    const onFocus = () => {
      if (!cancelled) void refresh();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
    }
    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      }
    };
  }, [languageId]);

  return byTopic;
}
