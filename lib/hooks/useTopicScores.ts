'use client';

import { useEffect, useState } from 'react';

export interface TopicScore {
  average: number;
  count: number;
}

/**
 * Fetches the public per-topic rating aggregates from `/api/feedback/topic-scores`.
 * Returns an empty map until the fetch resolves; callers should treat missing
 * entries as "no ratings yet".
 */
export const useTopicScores = (): Record<string, TopicScore> => {
  const [scores, setScores] = useState<Record<string, TopicScore>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/feedback/topic-scores', {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: Record<string, TopicScore>;
        };
        if (!cancelled && json.data) setScores(json.data);
      } catch {
        // Silent — cards fall back to "No ratings yet".
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return scores;
};
