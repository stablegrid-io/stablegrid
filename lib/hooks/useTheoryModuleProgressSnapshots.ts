'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ServerTheoryModuleProgressSnapshot } from '@/lib/learn/serverTheoryProgress';

interface ModuleProgressApiRow {
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  updated_at: string | null;
}

interface ModuleProgressApiPayload {
  data?: ModuleProgressApiRow[];
}

const buildModuleProgressById = (
  rows: ModuleProgressApiRow[]
): Record<string, ServerTheoryModuleProgressSnapshot> =>
  rows.reduce<Record<string, ServerTheoryModuleProgressSnapshot>>((accumulator, row) => {
    accumulator[row.module_id] = {
      moduleOrder: row.module_order,
      isUnlocked: row.is_unlocked,
      isCompleted: row.is_completed,
      currentLessonId: row.current_lesson_id,
      lastVisitedRoute: row.last_visited_route,
      updatedAt: row.updated_at
    };
    return accumulator;
  }, {});

const getCompletedChapterIdsFromModuleProgress = (
  moduleProgressById: Record<string, ServerTheoryModuleProgressSnapshot>
) =>
  Object.entries(moduleProgressById)
    .filter(([, progress]) => progress.isCompleted)
    .sort((left, right) => left[1].moduleOrder - right[1].moduleOrder)
    .map(([moduleId]) => moduleId);

export const resolveCompletedChapterIds = ({
  completedChapterIds,
  moduleProgressById
}: {
  completedChapterIds: string[];
  moduleProgressById: Record<string, ServerTheoryModuleProgressSnapshot>;
}) => {
  if (Object.keys(moduleProgressById).length === 0) {
    return completedChapterIds;
  }

  return getCompletedChapterIdsFromModuleProgress(moduleProgressById);
};

export const useTheoryModuleProgressSnapshots = ({
  topic,
  initialCompletedChapterIds,
  initialModuleProgressById
}: {
  topic: string;
  initialCompletedChapterIds: string[];
  initialModuleProgressById?: Record<string, ServerTheoryModuleProgressSnapshot>;
}) => {
  const [moduleProgressById, setModuleProgressById] = useState<
    Record<string, ServerTheoryModuleProgressSnapshot>
  >(initialModuleProgressById ?? {});

  useEffect(() => {
    setModuleProgressById(initialModuleProgressById ?? {});
  }, [initialModuleProgressById]);

  useEffect(() => {
    // Skip the client-side refetch if the server already provided module progress.
    // This prevents the flash where progress bars jump to 100% then drop back
    // because the API response momentarily clears the server-rendered state.
    if (initialModuleProgressById && Object.keys(initialModuleProgressById).length > 0) {
      return;
    }

    let cancelled = false;

    const refreshProgress = async () => {
      try {
        const response = await fetch(
          `/api/learn/module-progress?topic=${encodeURIComponent(topic)}`,
          {
            method: 'GET',
            cache: 'no-store'
          }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as ModuleProgressApiPayload;
        const rows = Array.isArray(payload.data) ? payload.data : [];
        if (rows.length === 0 || cancelled) {
          return;
        }

        setModuleProgressById(buildModuleProgressById(rows));
      } catch {
        // Keep the server-rendered snapshot if the live refresh fails.
      }
    };

    void refreshProgress();

    return () => {
      cancelled = true;
    };
  }, [topic, initialModuleProgressById]);

  const completedChapterIds = useMemo(
    () =>
      resolveCompletedChapterIds({
        completedChapterIds: initialCompletedChapterIds,
        moduleProgressById
      }),
    [initialCompletedChapterIds, moduleProgressById]
  );

  return {
    completedChapterIds,
    moduleProgressById
  };
};
