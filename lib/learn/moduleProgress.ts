export interface CanonicalModuleEntry {
  id: string;
  order: number;
}

export interface ModuleProgressRowLike {
  module_id: string;
  module_order: number;
  is_unlocked: boolean;
  is_completed: boolean;
  current_lesson_id: string | null;
  last_visited_route: string | null;
  completed_at: string | null;
  updated_at?: string;
}

export interface ModuleProgressUpsertRow extends ModuleProgressRowLike {
  user_id: string;
  topic: string;
  updated_at: string;
}

const toRowMap = (rows: ModuleProgressRowLike[]) =>
  new Map(rows.map((row) => [row.module_id, row]));

export const normalizeModuleProgressChain = ({
  canonicalModules,
  existingRows,
  userId,
  topic,
  nowIso
}: {
  canonicalModules: CanonicalModuleEntry[];
  existingRows: ModuleProgressRowLike[];
  userId: string;
  topic: string;
  nowIso: string;
}) => {
  const byId = toRowMap(existingRows);
  const orderedModules = [...canonicalModules].sort((left, right) => left.order - right.order);
  let previousCompleted = false;

  return orderedModules.map<ModuleProgressUpsertRow>((module, index) => {
    const row = byId.get(module.id);
    const isCompleted = Boolean(row?.is_completed);
    const shouldUnlock = index === 0 || previousCompleted || isCompleted;
    previousCompleted = isCompleted;
    const currentLessonId = row?.current_lesson_id ?? null;
    const lastVisitedRoute = row?.last_visited_route ?? null;
    const completedAt = isCompleted ? row?.completed_at ?? nowIso : null;
    const didChange =
      !row ||
      row.module_order !== module.order ||
      row.is_unlocked !== shouldUnlock ||
      row.is_completed !== isCompleted ||
      (row.current_lesson_id ?? null) !== currentLessonId ||
      (row.last_visited_route ?? null) !== lastVisitedRoute ||
      (row.completed_at ?? null) !== completedAt;

    return {
      user_id: userId,
      topic,
      module_id: module.id,
      module_order: module.order,
      is_unlocked: shouldUnlock,
      is_completed: isCompleted,
      current_lesson_id: currentLessonId,
      last_visited_route: lastVisitedRoute,
      completed_at: completedAt,
      updated_at: didChange ? nowIso : row?.updated_at ?? nowIso
    };
  });
};

export const mutateModuleProgressRows = ({
  rows,
  moduleId,
  mutation,
  nowIso
}: {
  rows: ModuleProgressRowLike[];
  moduleId: string;
  mutation:
    | { type: 'complete' }
    | { type: 'incomplete' }
    | { type: 'touch'; currentLessonId?: string | null; lastVisitedRoute?: string | null };
  nowIso: string;
}) =>
  rows.map<ModuleProgressRowLike>((row) => {
    if (row.module_id !== moduleId) {
      return row;
    }

    if (mutation.type === 'complete') {
      return {
        ...row,
        is_completed: true,
        completed_at: nowIso,
        updated_at: nowIso
      };
    }

    if (mutation.type === 'incomplete') {
      return {
        ...row,
        is_completed: false,
        completed_at: null,
        updated_at: nowIso
      };
    }

    return {
      ...row,
      current_lesson_id:
        mutation.currentLessonId === undefined
          ? row.current_lesson_id
          : mutation.currentLessonId,
      last_visited_route:
        mutation.lastVisitedRoute === undefined
          ? row.last_visited_route
          : mutation.lastVisitedRoute,
      updated_at: nowIso
    };
  });
