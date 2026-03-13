import type { Topic } from '@/types/progress';

type SupabaseClient = any;

export type ActivationTaskType = 'theory' | 'task';
export type ActivationTaskGroup = 'theory' | 'flashcards' | 'notebooks' | 'missions';
export type ActivationScopeType = 'count' | 'all_remaining';
export type ActivationTaskStatus = 'todo' | 'in_progress' | 'completed';
export type ActivationItemStatus = 'todo' | 'in_progress' | 'completed';
export type ActivationContentType = 'theory_module' | 'flashcard' | 'notebook' | 'mission';
type ActivationTaskOptionGroup =
  | 'theory'
  | 'theoryCompleted'
  | 'flashcards'
  | 'notebooks'
  | 'missions';

const TRACK_SET = new Set<Topic>(['pyspark', 'fabric']);
const MODULE_PROGRESS_MISSING_TABLE_PATTERN =
  /module_progress.*(does not exist|42P01)/i;
const OPTIONAL_READING_COLUMN_PATTERN =
  /(current_lesson_id|last_visited_route|sections_ids_read)/i;
const TASK_SORT_ORDER_STEP = 1000;

const TASK_GROUP_TO_CONTENT_TYPE: Record<ActivationTaskGroup, ActivationContentType> = {
  theory: 'theory_module',
  flashcards: 'flashcard',
  notebooks: 'notebook',
  missions: 'mission'
};

const CONTENT_TYPE_TO_TASK_OPTION_GROUP: Record<
  ActivationContentType,
  ActivationTaskOptionGroup | null
> = {
  theory_module: 'theory',
  flashcard: 'flashcards',
  notebook: 'notebooks',
  mission: 'missions'
};

interface TrackRow {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
}

interface ContentItemRow {
  id: string;
  track_id: string | null;
  content_type: ActivationContentType;
  source_ref: string;
  title: string;
  sequence_order: number;
}

interface ContentItemCatalogRow extends ContentItemRow {
  tracks: {
    slug: string;
    title: string;
    is_active: boolean;
  } | null;
}

interface ActivationTaskRow {
  id: string;
  user_id: string;
  task_type: ActivationTaskType;
  task_group: ActivationTaskGroup;
  title: string;
  description: string;
  scope_type: ActivationScopeType;
  requested_count: number | null;
  status: ActivationTaskStatus;
  sort_order: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  tracks: { slug: string; title: string } | null;
  user_activation_task_items?: Array<{
    id: string;
    item_status: ActivationItemStatus;
    started_at: string | null;
    completed_at: string | null;
    content_item_id: string;
  }>;
}

interface ActivationTaskReconcileRow {
  id: string;
  status: ActivationTaskStatus;
  started_at: string | null;
  completed_at: string | null;
}

interface ActivationTaskItemRow {
  id: string;
  user_id: string;
  activation_task_id: string;
  item_status: ActivationItemStatus;
  started_at: string | null;
  completed_at: string | null;
  content_items: {
    content_type: ActivationContentType;
    source_ref: string;
  } | null;
}

interface CompletionSignals {
  completed: Record<ActivationContentType, Set<string>>;
  started: Record<ActivationContentType, Set<string>>;
}

export interface CreateActivationTaskInput {
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  trackSlug?: string;
  scopeType: ActivationScopeType;
  requestedCount?: number;
  contentItemIds?: string[];
  contentItemId?: string;
}

interface NormalizedActivationTaskInput {
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  scopeType: ActivationScopeType;
  requestedCount: number | null;
  trackSlug: Topic | null;
  contentItemIds: string[];
}

export interface ActivationCatalogTaskOption {
  id: string;
  title: string;
  label: string;
  trackSlug: string | null;
  trackTitle: string | null;
}

export interface ActivationBoardCard {
  id: string;
  title: string;
  description: string;
  status: ActivationTaskStatus;
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  trackSlug: string | null;
  trackTitle: string | null;
  scopeType: ActivationScopeType;
  requestedCount: number | null;
  progress: {
    completed: number;
    total: number;
  };
  primaryContentItemId: string | null;
  statusLabel: string | null;
  actionLabel: 'Start' | 'Open' | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ActivationBoardData {
  todo: ActivationBoardCard[];
  inProgress: ActivationBoardCard[];
  completed: ActivationBoardCard[];
  catalog: {
    tracks: Array<{ slug: string; title: string }>;
    taskOptions?: Record<ActivationTaskOptionGroup, ActivationCatalogTaskOption[]>;
  };
}

export class ActivationServiceError extends Error {
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const isTopic = (value: string): value is Topic => TRACK_SET.has(value as Topic);

const toRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
};

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];

const isMissingModuleProgressTableError = (error: unknown) =>
  error instanceof Error && MODULE_PROGRESS_MISSING_TABLE_PATTERN.test(error.message);

const isOptionalReadingColumnError = (error: unknown) =>
  error instanceof Error && OPTIONAL_READING_COLUMN_PATTERN.test(error.message);

const assertSuccess = (error: { message?: string } | null) => {
  if (error) {
    throw new Error(error.message ?? 'Unexpected Supabase error.');
  }
};

const getStatusLabel = (status: ActivationTaskStatus, completed: number, total: number) => {
  if (total === 0) return null;
  if (status === 'todo') return `${total} linked ${total === 1 ? 'item' : 'items'}`;
  return `${completed}/${total} complete`;
};

const getActionLabel = (status: ActivationTaskStatus): 'Start' | 'Open' | null => {
  if (status === 'todo') return 'Start';
  if (status === 'in_progress') return 'Open';
  return null;
};

const compareTaskRowsForBoard = (left: ActivationTaskRow, right: ActivationTaskRow) => {
  const leftHasSortOrder = typeof left.sort_order === 'number';
  const rightHasSortOrder = typeof right.sort_order === 'number';

  if (leftHasSortOrder && rightHasSortOrder && left.sort_order !== right.sort_order) {
    return left.sort_order - right.sort_order;
  }

  if (leftHasSortOrder !== rightHasSortOrder) {
    return leftHasSortOrder ? -1 : 1;
  }

  return right.created_at.localeCompare(left.created_at);
};

const getTopSortOrderForStatus = async ({
  supabase,
  userId,
  status
}: {
  supabase: SupabaseClient;
  userId: string;
  status: ActivationTaskStatus;
}) => {
  const { data, error } = await supabase
    .from('user_activation_tasks')
    .select('sort_order')
    .eq('user_id', userId)
    .eq('status', status)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  assertSuccess(error);

  if (typeof data?.sort_order !== 'number') {
    return TASK_SORT_ORDER_STEP;
  }

  return data.sort_order - TASK_SORT_ORDER_STEP;
};

const buildSequentialSortOrder = (index: number) => (index + 1) * TASK_SORT_ORDER_STEP;

const buildTaskCopy = ({
  taskType,
  taskGroup,
  scopeType,
  requestedCount,
  trackTitle
}: {
  taskType: ActivationTaskType;
  taskGroup: ActivationTaskGroup;
  scopeType: ActivationScopeType;
  requestedCount: number | null;
  trackTitle: string | null;
}) => {
  if (taskType === 'theory') {
    if (!trackTitle) {
      throw new ActivationServiceError('Track is required for theory tasks.', 400);
    }

    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle} theory`,
        description: 'Continue through the next theory units in this track.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle} ${count === 1 ? 'module' : 'modules'}`,
      description: 'Continue through the next theory units in this track.'
    };
  }

  if (taskGroup === 'flashcards') {
    if (!trackTitle) {
      throw new ActivationServiceError('Track is required for flashcard tasks.', 400);
    }

    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle} flashcards`,
        description: 'Apply your learning through guided practical work.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle} ${count === 1 ? 'flashcard' : 'flashcards'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (taskGroup === 'notebooks') {
    if (!trackTitle) {
      throw new ActivationServiceError('Track is required for notebook tasks.', 400);
    }

    if (scopeType === 'all_remaining') {
      return {
        title: `Complete all remaining ${trackTitle} notebooks`,
        description: 'Apply your learning through guided practical work.'
      };
    }

    const count = requestedCount ?? 1;
    return {
      title: `Complete ${count} ${trackTitle} ${count === 1 ? 'notebook' : 'notebooks'}`,
      description: 'Apply your learning through guided practical work.'
    };
  }

  if (scopeType === 'all_remaining') {
    return {
      title: 'Complete all remaining missions',
      description: 'Apply your learning through guided practical work.'
    };
  }

  const count = requestedCount ?? 1;
  return {
    title: `Complete ${count} ${count === 1 ? 'mission' : 'missions'}`,
    description: 'Apply your learning through guided practical work.'
  };
};

const getTrackBySlug = async (supabase: SupabaseClient, slug: string) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('id,slug,title,is_active')
    .eq('slug', slug)
    .maybeSingle();

  assertSuccess(error);
  return data;
};

const getActiveTrackCatalog = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('tracks')
    .select('slug,title,is_active')
    .in('slug', ['pyspark', 'fabric'])
    .eq('is_active', true)
    .order('slug', { ascending: true });

  assertSuccess(error);

  return (data ?? []).map((row: { slug: string; title: string }) => ({
    slug: row.slug,
    title: row.title
  }));
};

const getTaskOptionCatalog = async (
  supabase: SupabaseClient,
  userId: string
): Promise<Record<ActivationTaskOptionGroup, ActivationCatalogTaskOption[]>> => {
  const options: Record<ActivationTaskOptionGroup, ActivationCatalogTaskOption[]> = {
    theory: [],
    theoryCompleted: [],
    flashcards: [],
    notebooks: [],
    missions: []
  };

  const { data: contentItemsRaw, error: contentError } = await supabase
    .from('content_items')
    .select(
      'id,track_id,content_type,source_ref,title,sequence_order,tracks:track_id(slug,title,is_active)'
    )
    .eq('is_active', true)
    .in('content_type', ['theory_module', 'flashcard', 'notebook', 'mission'])
    .order('sequence_order', { ascending: true });
  assertSuccess(contentError);

  const completionSignals = await loadCompletionSignals(supabase, userId);
  const activeAssignedContentIds = await loadActiveContentAssignments(supabase, userId, {
    activeOnly: true
  });
  const assignedContentIds = await loadActiveContentAssignments(supabase, userId, {
    activeOnly: false
  });

  (contentItemsRaw as ContentItemCatalogRow[] | null)?.forEach((item) => {
    const taskOptionGroup = CONTENT_TYPE_TO_TASK_OPTION_GROUP[item.content_type];
    if (!taskOptionGroup) return;

    if (taskOptionGroup === 'theory') {
      if (!item.tracks || !item.tracks.is_active || !isTopic(item.tracks.slug)) {
        return;
      }

      if (completionSignals.completed.theory_module.has(item.source_ref)) {
        options.theoryCompleted.push({
          id: item.id,
          title: item.title,
          label: `${item.tracks.title}: ${item.title}`,
          trackSlug: item.tracks.slug,
          trackTitle: item.tracks.title
        });
        return;
      }

      if (assignedContentIds.has(item.id)) return;
      if (completionSignals.started.theory_module.has(item.source_ref)) return;

      options.theory.push({
        id: item.id,
        title: item.title,
        label: `${item.tracks.title}: ${item.title}`,
        trackSlug: item.tracks.slug,
        trackTitle: item.tracks.title
      });
      return;
    }

    if (activeAssignedContentIds.has(item.id)) return;
    if (completionSignals.started[item.content_type].has(item.source_ref)) return;
    if (completionSignals.completed[item.content_type].has(item.source_ref)) return;

    if (taskOptionGroup === 'missions') {
      options.missions.push({
        id: item.id,
        title: item.title,
        label: item.title,
        trackSlug: null,
        trackTitle: null
      });
      return;
    }

    if (!item.tracks || !item.tracks.is_active || !isTopic(item.tracks.slug)) {
      return;
    }

    options[taskOptionGroup].push({
      id: item.id,
      title: item.title,
      label: `${item.tracks.title}: ${item.title}`,
      trackSlug: item.tracks.slug,
      trackTitle: item.tracks.title
    });
  });

  return options;
};

const loadCompletedTheorySignals = async (supabase: SupabaseClient, userId: string) => {
  const completed = new Set<string>();
  const started = new Set<string>();

  const { data: moduleRows, error: moduleError } = await supabase
    .from('module_progress')
    .select('module_id,is_completed,current_lesson_id,last_visited_route')
    .eq('user_id', userId);

  if (!moduleError) {
    (moduleRows ?? []).forEach(
      (row: {
        module_id?: string | null;
        is_completed?: boolean | null;
        current_lesson_id?: string | null;
        last_visited_route?: string | null;
      }) => {
        if (typeof row.module_id !== 'string') return;
        if (row.is_completed) {
          completed.add(row.module_id);
          started.add(row.module_id);
          return;
        }
        if (row.current_lesson_id || row.last_visited_route) {
          started.add(row.module_id);
        }
      }
    );

    return { completed, started };
  }

  if (!isMissingModuleProgressTableError(new Error(moduleError.message))) {
    throw new Error(moduleError.message);
  }

  const { data: readingRows, error: readingError } = await supabase
    .from('reading_sessions')
    .select(
      'chapter_id,is_completed,sections_read,sections_ids_read,current_lesson_id,last_visited_route'
    )
    .eq('user_id', userId);

  if (readingError && isOptionalReadingColumnError(new Error(readingError.message))) {
    const { data: legacyRows, error: legacyError } = await supabase
      .from('reading_sessions')
      .select('chapter_id,is_completed,sections_read')
      .eq('user_id', userId);

    assertSuccess(legacyError);

    (legacyRows ?? []).forEach(
      (row: { chapter_id?: string | null; is_completed?: boolean | null; sections_read?: number | null }) => {
        if (typeof row.chapter_id !== 'string') return;
        if (row.is_completed) {
          completed.add(row.chapter_id);
          started.add(row.chapter_id);
          return;
        }
        if ((row.sections_read ?? 0) > 0) {
          started.add(row.chapter_id);
        }
      }
    );

    return { completed, started };
  }

  assertSuccess(readingError);

  (readingRows ?? []).forEach(
    (row: {
      chapter_id?: string | null;
      is_completed?: boolean | null;
      sections_read?: number | null;
      sections_ids_read?: string[] | null;
      current_lesson_id?: string | null;
      last_visited_route?: string | null;
    }) => {
      if (typeof row.chapter_id !== 'string') return;
      if (row.is_completed) {
        completed.add(row.chapter_id);
        started.add(row.chapter_id);
        return;
      }
      if (
        (row.sections_read ?? 0) > 0 ||
        (Array.isArray(row.sections_ids_read) && row.sections_ids_read.length > 0) ||
        row.current_lesson_id ||
        row.last_visited_route
      ) {
        started.add(row.chapter_id);
      }
    }
  );

  return { completed, started };
};

const loadCompletionSignals = async (
  supabase: SupabaseClient,
  userId: string
): Promise<CompletionSignals> => {
  const completed: CompletionSignals['completed'] = {
    theory_module: new Set<string>(),
    flashcard: new Set<string>(),
    notebook: new Set<string>(),
    mission: new Set<string>()
  };
  const started: CompletionSignals['started'] = {
    theory_module: new Set<string>(),
    flashcard: new Set<string>(),
    notebook: new Set<string>(),
    mission: new Set<string>()
  };

  const theorySignals = await loadCompletedTheorySignals(supabase, userId);
  completed.theory_module = theorySignals.completed;
  started.theory_module = theorySignals.started;

  const { data: userProgressRow, error: userProgressError } = await supabase
    .from('user_progress')
    .select('completed_questions,topic_progress')
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(userProgressError);

  toStringArray(userProgressRow?.completed_questions).forEach((questionId) => {
    completed.flashcard.add(questionId);
    started.flashcard.add(questionId);
  });

  const topicProgress = toRecord(userProgressRow?.topic_progress);
  const notebookProgress = toRecord(topicProgress.notebooks);
  toStringArray(notebookProgress.completed_notebook_ids).forEach((notebookId) => {
    completed.notebook.add(notebookId);
    started.notebook.add(notebookId);
  });

  const { data: missionRows, error: missionError } = await supabase
    .from('user_missions')
    .select('mission_slug,state')
    .eq('user_id', userId);
  assertSuccess(missionError);

  (missionRows ?? []).forEach(
    (row: { mission_slug?: string | null; state?: string | null }) => {
      if (typeof row.mission_slug !== 'string') return;
      if (row.state === 'completed') {
        completed.mission.add(row.mission_slug);
        started.mission.add(row.mission_slug);
        return;
      }
      if (row.state === 'in_progress') {
        started.mission.add(row.mission_slug);
      }
    }
  );

  return { completed, started };
};

const loadActiveContentAssignments = async (
  supabase: SupabaseClient,
  userId: string,
  options?: { excludeTaskId?: string; activeOnly?: boolean }
) => {
  let taskQuery = supabase
    .from('user_activation_tasks')
    .select('id')
    .eq('user_id', userId);
  if (options?.activeOnly !== false) {
    taskQuery = taskQuery.in('status', ['todo', 'in_progress']);
  }

  const { data: activeTasks, error: activeTaskError } = await taskQuery;
  assertSuccess(activeTaskError);

  const activeTaskIds = (activeTasks ?? [])
    .map((row: { id: string }) => row.id)
    .filter((id: string) => id !== options?.excludeTaskId);
  if (activeTaskIds.length === 0) {
    return new Set<string>();
  }

  const { data: activeItems, error: activeItemError } = await supabase
    .from('user_activation_task_items')
    .select('content_item_id')
    .eq('user_id', userId)
    .in('activation_task_id', activeTaskIds);
  assertSuccess(activeItemError);

  return new Set((activeItems ?? []).map((row: { content_item_id: string }) => row.content_item_id));
};

const normalizeCreateInput = (input: CreateActivationTaskInput): NormalizedActivationTaskInput => {
  const taskType = input.taskType;
  const taskGroup = input.taskGroup;
  const scopeType = input.scopeType;
  const requestedCountRaw = input.requestedCount;
  const trackSlugRaw = typeof input.trackSlug === 'string' ? input.trackSlug : undefined;
  const contentItemIdsRaw = Array.isArray(input.contentItemIds)
    ? input.contentItemIds
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    : [];
  const contentItemIdRaw =
    typeof input.contentItemId === 'string' ? input.contentItemId.trim() : '';
  const contentItemIds = Array.from(
    new Set(
      [
        ...contentItemIdsRaw,
        ...(contentItemIdRaw.length > 0 ? [contentItemIdRaw] : [])
      ].filter((value) => value.length > 0)
    )
  );

  if (taskType !== 'theory' && taskType !== 'task') {
    throw new ActivationServiceError('Invalid taskType.', 400);
  }
  if (!['theory', 'flashcards', 'notebooks', 'missions'].includes(taskGroup)) {
    throw new ActivationServiceError('Invalid taskGroup.', 400);
  }
  if (scopeType !== 'count' && scopeType !== 'all_remaining') {
    throw new ActivationServiceError('Invalid scopeType.', 400);
  }

  if (taskType === 'theory' && taskGroup !== 'theory') {
    throw new ActivationServiceError('taskGroup must be theory when taskType is theory.', 400);
  }
  if (taskType === 'task' && taskGroup === 'theory') {
    throw new ActivationServiceError('taskGroup cannot be theory when taskType is task.', 400);
  }

  const hasSpecificItemSelection = contentItemIds.length > 0;
  if (taskType === 'task' && contentItemIds.length > 1) {
    throw new ActivationServiceError('Task commitments can only select one item.', 400);
  }

  if (taskGroup === 'missions') {
    if (trackSlugRaw) {
      throw new ActivationServiceError('trackSlug must be omitted for missions.', 400);
    }
  } else {
    if (!trackSlugRaw || !isTopic(trackSlugRaw)) {
      if (hasSpecificItemSelection) {
        // For explicit task-item selection we can derive track from the selected item.
      } else {
        throw new ActivationServiceError('trackSlug must be pyspark or fabric.', 400);
      }
    }
  }

  let requestedCount: number | null = null;
  if (hasSpecificItemSelection) {
    requestedCount = contentItemIds.length;
  } else if (scopeType === 'count') {
    if (
      typeof requestedCountRaw !== 'number' ||
      !Number.isInteger(requestedCountRaw) ||
      requestedCountRaw < 1 ||
      requestedCountRaw > 3
    ) {
      throw new ActivationServiceError('requestedCount must be 1, 2, or 3.', 400);
    }
    requestedCount = requestedCountRaw;
  }

  return {
    taskType,
    taskGroup,
    scopeType: hasSpecificItemSelection ? 'count' : scopeType,
    requestedCount,
    trackSlug:
      taskGroup === 'missions' || !trackSlugRaw || !isTopic(trackSlugRaw)
        ? null
        : (trackSlugRaw as Topic),
    contentItemIds
  };
};

const resolveTaskSelectionPlan = async ({
  supabase,
  userId,
  input,
  excludeTaskId
}: {
  supabase: SupabaseClient;
  userId: string;
  input: CreateActivationTaskInput;
  excludeTaskId?: string;
}) => {
  const normalized = normalizeCreateInput(input);
  const contentType = TASK_GROUP_TO_CONTENT_TYPE[normalized.taskGroup];
  const completionSignals = await loadCompletionSignals(supabase, userId);
  const activeAssignedContentIds = await loadActiveContentAssignments(supabase, userId, {
    excludeTaskId,
    activeOnly: true
  });
  const assignedContentIds = await loadActiveContentAssignments(supabase, userId, {
    excludeTaskId,
    activeOnly: false
  });
  const blockedAssignedContentIds =
    normalized.taskGroup === 'theory' ? assignedContentIds : activeAssignedContentIds;

  if (normalized.contentItemIds.length > 0) {
    const { data: itemsRaw, error: itemsError } = await supabase
      .from('content_items')
      .select(
        'id,track_id,content_type,source_ref,title,sequence_order,tracks:track_id(slug,title,is_active)'
      )
      .in('id', normalized.contentItemIds)
      .eq('is_active', true);
    assertSuccess(itemsError);

    const selectedItemsRaw = (itemsRaw ?? []) as ContentItemCatalogRow[];
    if (selectedItemsRaw.length !== normalized.contentItemIds.length) {
      throw new ActivationServiceError('One or more selected items are not available.', 400);
    }

    const selectedById = new Map(selectedItemsRaw.map((item) => [item.id, item]));
    const selectedItems = normalized.contentItemIds.map((id) => {
      const item = selectedById.get(id);
      if (!item) {
        throw new ActivationServiceError('One or more selected items are not available.', 400);
      }
      return item;
    });

    if (selectedItems.some((item) => item.content_type !== contentType)) {
      throw new ActivationServiceError('Selected item is not available for this task group.', 400);
    }

    selectedItems.forEach((selectedItem) => {
      if (blockedAssignedContentIds.has(selectedItem.id)) {
        throw new ActivationServiceError('Selected item is already linked to an existing task.', 422, {
          remainingCount: 0
        });
      }

      if (
        completionSignals.started[selectedItem.content_type].has(selectedItem.source_ref) ||
        completionSignals.completed[selectedItem.content_type].has(selectedItem.source_ref)
      ) {
        throw new ActivationServiceError('Selected item is already started or completed.', 422, {
          remainingCount: 0
        });
      }
    });

    let track: TrackRow | null = null;
    if (normalized.taskGroup === 'missions') {
      const globalTrack = await getTrackBySlug(supabase, 'global');
      const invalidMissionSelection = selectedItems.some(
        (item) => globalTrack?.id && item.track_id && item.track_id !== globalTrack.id
      );
      if (invalidMissionSelection) {
        throw new ActivationServiceError('Selected mission is not available.', 400);
      }
    } else {
      const firstTrack = selectedItems[0]?.tracks;
      if (!firstTrack || !firstTrack.is_active || !isTopic(firstTrack.slug)) {
        throw new ActivationServiceError('Selected track is not available.', 400);
      }

      const mixedTrackSelection = selectedItems.some((item) => {
        if (!item.tracks || !item.tracks.is_active || !isTopic(item.tracks.slug)) return true;
        return item.tracks.slug !== firstTrack.slug;
      });
      if (mixedTrackSelection) {
        throw new ActivationServiceError('Selected items must belong to the same subject.', 400);
      }
      if (normalized.trackSlug && normalized.trackSlug !== firstTrack.slug) {
        throw new ActivationServiceError('Selected items do not belong to the chosen subject.', 400);
      }
      if (!selectedItems[0]?.track_id) {
        throw new ActivationServiceError('Selected item is missing track metadata.', 400);
      }

      track = {
        id: selectedItems[0].track_id,
        slug: firstTrack.slug,
        title: firstTrack.title,
        is_active: firstTrack.is_active
      };
    }

    const copy =
      normalized.taskType === 'theory'
        ? selectedItems.length === 1
          ? {
              title: `Complete ${selectedItems[0].title}`,
              description: 'Continue through this theory module in your track.'
            }
          : {
              title: `Complete ${selectedItems.length} selected modules`,
              description: 'Continue through these selected theory modules in your track.'
            }
        : buildTaskCopy({
            taskType: normalized.taskType,
            taskGroup: normalized.taskGroup,
            scopeType: 'count',
            requestedCount: selectedItems.length,
            trackTitle: track?.title ?? null
          });

    return {
      normalized: {
        ...normalized,
        scopeType: 'count',
        requestedCount: selectedItems.length,
        trackSlug: track && isTopic(track.slug) ? track.slug : null
      },
      track,
      selectedItems,
      copy
    };
  }

  const track =
    normalized.trackSlug !== null ? await getTrackBySlug(supabase, normalized.trackSlug) : null;
  if (normalized.trackSlug && (!track || !track.is_active)) {
    throw new ActivationServiceError('Selected track is not available.', 400);
  }

  let contentQuery = supabase
    .from('content_items')
    .select('id,track_id,content_type,source_ref,title,sequence_order')
    .eq('is_active', true)
    .eq('content_type', contentType)
    .order('sequence_order', { ascending: true });

  if (normalized.taskGroup === 'missions') {
    const globalTrack = await getTrackBySlug(supabase, 'global');
    if (globalTrack?.id) {
      contentQuery = contentQuery.eq('track_id', globalTrack.id);
    }
  } else {
    contentQuery = contentQuery.eq('track_id', track?.id ?? '');
  }

  const { data: contentItems, error: contentError } = await contentQuery;
  assertSuccess(contentError);

  const eligibleItems = ((contentItems ?? []) as ContentItemRow[]).filter((item) => {
    if (blockedAssignedContentIds.has(item.id)) {
      return false;
    }
    if (completionSignals.started[item.content_type].has(item.source_ref)) {
      return false;
    }
    if (completionSignals.completed[item.content_type].has(item.source_ref)) {
      return false;
    }
    return true;
  });

  if (eligibleItems.length === 0) {
    throw new ActivationServiceError('No eligible items remaining for this selection.', 422, {
      remainingCount: 0
    });
  }

  const selectedItems =
    normalized.scopeType === 'count'
      ? (() => {
          const requested = normalized.requestedCount ?? 1;
          if (eligibleItems.length < requested) {
            throw new ActivationServiceError(
              `Only ${eligibleItems.length} eligible item(s) remain.`,
              422,
              {
                remainingCount: eligibleItems.length
              }
            );
          }
          return eligibleItems.slice(0, requested);
        })()
      : eligibleItems;

  const copy = buildTaskCopy({
    taskType: normalized.taskType,
    taskGroup: normalized.taskGroup,
    scopeType: normalized.scopeType,
    requestedCount: normalized.requestedCount,
    trackTitle: track?.title ?? null
  });

  return {
    normalized,
    track,
    selectedItems,
    copy
  };
};

export const createActivationTask = async ({
  supabase,
  userId,
  input
}: {
  supabase: SupabaseClient;
  userId: string;
  input: CreateActivationTaskInput;
}) => {
  const { normalized, track, selectedItems, copy } = await resolveTaskSelectionPlan({
    supabase,
    userId,
    input
  });
  const sortOrder = await getTopSortOrderForStatus({
    supabase,
    userId,
    status: 'todo'
  });

  const taskInsertPayload = {
    user_id: userId,
    task_type: normalized.taskType,
    task_group: normalized.taskGroup,
    track_id: track?.id ?? null,
    title: copy.title,
    description: copy.description,
    scope_type: normalized.scopeType,
    requested_count: normalized.scopeType === 'count' ? normalized.requestedCount : null,
    status: 'todo' as const,
    sort_order: sortOrder
  };

  const { data: createdTask, error: createTaskError } = await supabase
    .from('user_activation_tasks')
    .insert(taskInsertPayload)
    .select('id')
    .single();
  assertSuccess(createTaskError);

  const itemInsertPayload = selectedItems.map((item) => ({
    user_id: userId,
    activation_task_id: createdTask.id,
    content_item_id: item.id,
    item_status: 'todo' as const
  }));

  const { error: createItemsError } = await supabase
    .from('user_activation_task_items')
    .insert(itemInsertPayload);

  if (createItemsError) {
    await supabase
      .from('user_activation_tasks')
      .delete()
      .eq('id', createdTask.id)
      .eq('user_id', userId);
    throw new Error(createItemsError.message);
  }

  return {
    taskId: createdTask.id,
    linkedCount: selectedItems.length
  };
};

export const editActivationTask = async ({
  supabase,
  userId,
  taskId,
  input
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
  input: CreateActivationTaskInput;
}) => {
  const { data: task, error: taskError } = await supabase
    .from('user_activation_tasks')
    .select('id,status,started_at')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(taskError);

  if (!task) {
    throw new ActivationServiceError('Activation task not found.', 404);
  }

  if (task.status === 'completed') {
    throw new ActivationServiceError('Completed tasks cannot be edited.', 409);
  }

  const resetToStatus = task.status === 'in_progress' ? 'in_progress' : 'todo';
  const resetStartedAt =
    resetToStatus === 'in_progress' ? task.started_at ?? new Date().toISOString() : null;

  const { normalized, track, selectedItems, copy } = await resolveTaskSelectionPlan({
    supabase,
    userId,
    input,
    excludeTaskId: taskId
  });

  const { data: existingItems, error: existingItemsError } = await supabase
    .from('user_activation_task_items')
    .select('content_item_id,item_status,started_at,completed_at')
    .eq('activation_task_id', taskId)
    .eq('user_id', userId);
  assertSuccess(existingItemsError);

  const restoreItemPayload = (existingItems ?? []).map(
    (item: {
      content_item_id: string;
      item_status: ActivationItemStatus;
      started_at: string | null;
      completed_at: string | null;
    }) => ({
      user_id: userId,
      activation_task_id: taskId,
      content_item_id: item.content_item_id,
      item_status: item.item_status,
      started_at: item.started_at,
      completed_at: item.completed_at
    })
  );

  const { error: deleteItemsError } = await supabase
    .from('user_activation_task_items')
    .delete()
    .eq('activation_task_id', taskId)
    .eq('user_id', userId);
  assertSuccess(deleteItemsError);

  const itemInsertPayload = selectedItems.map((item) => ({
    user_id: userId,
    activation_task_id: taskId,
    content_item_id: item.id,
    item_status: 'todo' as const,
    started_at: null,
    completed_at: null
  }));

  const { error: createItemsError } = await supabase
    .from('user_activation_task_items')
    .insert(itemInsertPayload);

  if (createItemsError) {
    if (restoreItemPayload.length > 0) {
      await supabase.from('user_activation_task_items').insert(restoreItemPayload);
    }
    throw new Error(createItemsError.message);
  }

  const { error: updateTaskError } = await supabase
    .from('user_activation_tasks')
    .update({
      task_type: normalized.taskType,
      task_group: normalized.taskGroup,
      track_id: track?.id ?? null,
      title: copy.title,
      description: copy.description,
      scope_type: normalized.scopeType,
      requested_count: normalized.scopeType === 'count' ? normalized.requestedCount : null,
      status: resetToStatus,
      started_at: resetStartedAt,
      completed_at: null
    })
    .eq('id', taskId)
    .eq('user_id', userId);
  assertSuccess(updateTaskError);

  return {
    taskId,
    linkedCount: selectedItems.length
  };
};

export const deleteActivationTask = async ({
  supabase,
  userId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
}) => {
  const { data: task, error: taskError } = await supabase
    .from('user_activation_tasks')
    .select('id')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(taskError);

  if (!task) {
    throw new ActivationServiceError('Activation task not found.', 404);
  }

  const { error: deleteItemsError } = await supabase
    .from('user_activation_task_items')
    .delete()
    .eq('activation_task_id', taskId)
    .eq('user_id', userId);
  assertSuccess(deleteItemsError);

  const { error: deleteTaskError } = await supabase
    .from('user_activation_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);
  assertSuccess(deleteTaskError);
};

const loadUserTasksWithItems = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('user_activation_tasks')
    .select(
      'id,user_id,task_type,task_group,title,description,scope_type,requested_count,status,sort_order,created_at,started_at,completed_at,tracks:track_id(slug,title),user_activation_task_items(id,item_status,started_at,completed_at,content_item_id)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  assertSuccess(error);
  return (data ?? []) as ActivationTaskRow[];
};

const loadUserTasksForReconcile = async (supabase: SupabaseClient, userId: string) => {
  const { data, error } = await supabase
    .from('user_activation_tasks')
    .select('id,status,started_at,completed_at')
    .eq('user_id', userId);

  assertSuccess(error);
  return (data ?? []) as ActivationTaskReconcileRow[];
};

const runInBatches = async <T>(
  items: T[],
  worker: (item: T) => Promise<void>,
  batchSize = 20
) => {
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    await Promise.all(batch.map((item) => worker(item)));
  }
};

const mapTaskRowsToBoardData = (
  rows: ActivationTaskRow[],
  catalogTracks: Array<{ slug: string; title: string }>,
  taskOptions: Record<ActivationTaskOptionGroup, ActivationCatalogTaskOption[]>
): ActivationBoardData => {
  const todo: ActivationBoardCard[] = [];
  const inProgress: ActivationBoardCard[] = [];
  const completed: ActivationBoardCard[] = [];

  [...rows].sort(compareTaskRowsForBoard).forEach((row) => {
    const items = row.user_activation_task_items ?? [];
    const total = items.length;
    const completedCount = items.filter((item) => item.item_status === 'completed').length;

    const card: ActivationBoardCard = {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      taskType: row.task_type,
      taskGroup: row.task_group,
      trackSlug: row.tracks?.slug ?? null,
      trackTitle: row.tracks?.title ?? null,
      scopeType: row.scope_type,
      requestedCount: row.requested_count,
      progress: {
        completed: completedCount,
        total
      },
      primaryContentItemId: items[0]?.content_item_id ?? null,
      statusLabel: getStatusLabel(row.status, completedCount, total),
      actionLabel: getActionLabel(row.status),
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at
    };

    if (row.status === 'todo') {
      todo.push(card);
      return;
    }

    if (row.status === 'in_progress') {
      inProgress.push(card);
      return;
    }

    completed.push(card);
  });

  return {
    todo,
    inProgress,
    completed,
    catalog: {
      tracks: catalogTracks,
      taskOptions
    }
  };
};

export const reconcileActivationTaskStatuses = async ({
  supabase,
  userId
}: {
  supabase: SupabaseClient;
  userId: string;
}) => {
  const tasks = await loadUserTasksForReconcile(supabase, userId);
  if (tasks.length === 0) {
    return;
  }

  const taskIds = tasks.map((task) => task.id);
  const { data: itemRowsRaw, error: itemError } = await supabase
    .from('user_activation_task_items')
    .select(
      'id,user_id,activation_task_id,item_status,started_at,completed_at,content_items(content_type,source_ref)'
    )
    .eq('user_id', userId)
    .in('activation_task_id', taskIds);
  assertSuccess(itemError);

  const itemRows = (itemRowsRaw ?? []) as ActivationTaskItemRow[];
  const itemsByTaskId = new Map<string, ActivationTaskItemRow[]>();
  itemRows.forEach((item) => {
    const existing = itemsByTaskId.get(item.activation_task_id) ?? [];
    existing.push(item);
    itemsByTaskId.set(item.activation_task_id, existing);
  });

  const signals = await loadCompletionSignals(supabase, userId);
  const nowIso = new Date().toISOString();
  const itemUpdates: Array<{
    id: string;
    item_status: ActivationItemStatus;
    started_at: string | null;
    completed_at: string | null;
  }> = [];
  const taskUpdates: Array<{
    id: string;
    status: ActivationTaskStatus;
    started_at: string | null;
    completed_at: string | null;
  }> = [];

  tasks.forEach((task) => {
    const taskItems = itemsByTaskId.get(task.id) ?? [];
    let hasAnyProgress = false;
    let allCompleted = taskItems.length > 0;
    let firstProgressAt: string | null = task.started_at ?? null;

    taskItems.forEach((item) => {
      const content = item.content_items;
      if (!content) {
        allCompleted = false;
        return;
      }

      const isCompletedBySource = signals.completed[content.content_type].has(content.source_ref);
      const isStartedBySource = signals.started[content.content_type].has(content.source_ref);

      const derivedStatus: ActivationItemStatus = isCompletedBySource
        ? 'completed'
        : isStartedBySource || (task.started_at !== null && item.item_status === 'in_progress')
          ? 'in_progress'
          : 'todo';

      if (derivedStatus !== 'todo') {
        hasAnyProgress = true;
        firstProgressAt = firstProgressAt ?? item.started_at ?? nowIso;
      } else {
        allCompleted = false;
      }

      if (derivedStatus !== 'completed') {
        allCompleted = false;
      }

      const nextStartedAt =
        derivedStatus === 'todo' ? null : item.started_at ?? firstProgressAt ?? nowIso;
      const nextCompletedAt = derivedStatus === 'completed' ? item.completed_at ?? nowIso : null;

      if (
        derivedStatus !== item.item_status ||
        nextStartedAt !== item.started_at ||
        nextCompletedAt !== item.completed_at
      ) {
        itemUpdates.push({
          id: item.id,
          item_status: derivedStatus,
          started_at: nextStartedAt,
          completed_at: nextCompletedAt
        });
      }
    });

    const derivedTaskStatus: ActivationTaskStatus = allCompleted
      ? task.status === 'completed'
        ? 'completed'
        : 'in_progress'
      : hasAnyProgress || task.started_at !== null
        ? 'in_progress'
        : 'todo';

    const nextTaskStartedAt =
      derivedTaskStatus === 'todo' ? null : task.started_at ?? firstProgressAt ?? nowIso;
    const nextTaskCompletedAt =
      derivedTaskStatus === 'completed' ? task.completed_at ?? nowIso : null;

    if (
      derivedTaskStatus !== task.status ||
      nextTaskStartedAt !== task.started_at ||
      nextTaskCompletedAt !== task.completed_at
    ) {
      taskUpdates.push({
        id: task.id,
        status: derivedTaskStatus,
        started_at: nextTaskStartedAt,
        completed_at: nextTaskCompletedAt
      });
    }
  });

  await runInBatches(itemUpdates, async (update) => {
    const { error } = await supabase
      .from('user_activation_task_items')
      .update({
        item_status: update.item_status,
        started_at: update.started_at,
        completed_at: update.completed_at
      })
      .eq('id', update.id)
      .eq('user_id', userId);
    assertSuccess(error);
  });

  await runInBatches(taskUpdates, async (update) => {
    const { error } = await supabase
      .from('user_activation_tasks')
      .update({
        status: update.status,
        started_at: update.started_at,
        completed_at: update.completed_at
      })
      .eq('id', update.id)
      .eq('user_id', userId);
    assertSuccess(error);
  });
};

export const getActivationBoardData = async ({
  supabase,
  userId,
  shouldReconcile = true
}: {
  supabase: SupabaseClient;
  userId: string;
  shouldReconcile?: boolean;
}): Promise<ActivationBoardData> => {
  const catalogTracksPromise = getActiveTrackCatalog(supabase);

  if (shouldReconcile) {
    await reconcileActivationTaskStatuses({ supabase, userId });
  }

  const [tasks, catalogTracks, taskOptions] = await Promise.all([
    loadUserTasksWithItems(supabase, userId),
    catalogTracksPromise,
    getTaskOptionCatalog(supabase, userId)
  ]);

  return mapTaskRowsToBoardData(tasks, catalogTracks, taskOptions);
};

export const startActivationTask = async ({
  supabase,
  userId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
}) => {
  const { data: task, error: taskError } = await supabase
    .from('user_activation_tasks')
    .select('id,status,started_at')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(taskError);

  if (!task) {
    throw new ActivationServiceError('Activation task not found.', 404);
  }

  if (task.status === 'completed') {
    throw new ActivationServiceError('Completed tasks cannot be started.', 409);
  }

  const nowIso = new Date().toISOString();

  if (task.status === 'todo') {
    const sortOrder = await getTopSortOrderForStatus({
      supabase,
      userId,
      status: 'in_progress'
    });
    const { error: taskUpdateError } = await supabase
      .from('user_activation_tasks')
      .update({
        status: 'in_progress',
        started_at: task.started_at ?? nowIso,
        sort_order: sortOrder
      })
      .eq('id', task.id)
      .eq('user_id', userId);
    assertSuccess(taskUpdateError);
  }

  const { data: firstTodoItem, error: firstItemError } = await supabase
    .from('user_activation_task_items')
    .select('id,item_status,started_at')
    .eq('activation_task_id', task.id)
    .eq('user_id', userId)
    .eq('item_status', 'todo')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  assertSuccess(firstItemError);

  if (firstTodoItem) {
    const { error: itemUpdateError } = await supabase
      .from('user_activation_task_items')
      .update({
        item_status: 'in_progress',
        started_at: firstTodoItem.started_at ?? nowIso
      })
      .eq('id', firstTodoItem.id)
      .eq('user_id', userId);
    assertSuccess(itemUpdateError);
  }

};

export const moveActivationTaskToTodo = async ({
  supabase,
  userId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
}) => {
  const { data: task, error: taskError } = await supabase
    .from('user_activation_tasks')
    .select('id,status')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(taskError);

  if (!task) {
    throw new ActivationServiceError('Activation task not found.', 404);
  }

  if (task.status === 'completed') {
    throw new ActivationServiceError('Completed tasks cannot be moved to To Do.', 409);
  }

  if (task.status === 'todo') {
    return;
  }

  const { data: items, error: itemsError } = await supabase
    .from('user_activation_task_items')
    .select('id,item_status,completed_at')
    .eq('activation_task_id', task.id)
    .eq('user_id', userId);
  assertSuccess(itemsError);

  const completedItems = (items ?? []).filter(
    (item: { item_status: ActivationItemStatus; completed_at: string | null }) =>
      item.item_status === 'completed' || item.completed_at !== null
  );
  if (completedItems.length > 0) {
    throw new ActivationServiceError(
      'Tasks with completed progress cannot be moved back to To Do.',
      409
    );
  }

  const inProgressItems = (items ?? []).filter(
    (item: { id: string; item_status: ActivationItemStatus }) =>
      item.item_status === 'in_progress'
  ) as Array<{ id: string }>;

  await runInBatches(inProgressItems, async (item) => {
    const { error } = await supabase
      .from('user_activation_task_items')
      .update({
        item_status: 'todo',
        started_at: null,
        completed_at: null
      })
      .eq('id', item.id)
      .eq('user_id', userId);
    assertSuccess(error);
  });

  const sortOrder = await getTopSortOrderForStatus({
    supabase,
    userId,
    status: 'todo'
  });
  const { error: taskUpdateError } = await supabase
    .from('user_activation_tasks')
    .update({
      status: 'todo',
      started_at: null,
      completed_at: null,
      sort_order: sortOrder
    })
    .eq('id', task.id)
    .eq('user_id', userId);
  assertSuccess(taskUpdateError);
};

export const moveActivationTaskToCompleted = async ({
  supabase,
  userId,
  taskId
}: {
  supabase: SupabaseClient;
  userId: string;
  taskId: string;
}) => {
  const { data: task, error: taskError } = await supabase
    .from('user_activation_tasks')
    .select('id,status,started_at,completed_at')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  assertSuccess(taskError);

  if (!task) {
    throw new ActivationServiceError('Activation task not found.', 404);
  }

  if (task.status === 'completed') {
    return;
  }

  if (task.status !== 'in_progress') {
    throw new ActivationServiceError('Only in-progress tasks can be completed.', 409);
  }

  const { data: items, error: itemsError } = await supabase
    .from('user_activation_task_items')
    .select('id,item_status,started_at,completed_at')
    .eq('activation_task_id', task.id)
    .eq('user_id', userId);
  assertSuccess(itemsError);

  const taskItems = (items ?? []) as Array<{
    id: string;
    item_status: ActivationItemStatus;
    started_at: string | null;
    completed_at: string | null;
  }>;
  const allCompleted =
    taskItems.length > 0 &&
    taskItems.every(
      (item) => item.item_status === 'completed' || item.completed_at !== null
    );

  if (!allCompleted) {
    throw new ActivationServiceError('Finish all linked items to unlock Completed.', 409);
  }

  const nowIso = new Date().toISOString();
  const firstProgressAt =
    taskItems.find((item) => item.started_at)?.started_at ??
    taskItems.find((item) => item.completed_at)?.completed_at ??
    nowIso;
  const sortOrder = await getTopSortOrderForStatus({
    supabase,
    userId,
    status: 'completed'
  });

  const { error: taskUpdateError } = await supabase
    .from('user_activation_tasks')
    .update({
      status: 'completed',
      started_at: task.started_at ?? firstProgressAt,
      completed_at: task.completed_at ?? nowIso,
      sort_order: sortOrder
    })
    .eq('id', task.id)
    .eq('user_id', userId);
  assertSuccess(taskUpdateError);
};

export const reorderActivationTasks = async ({
  supabase,
  userId,
  status,
  orderedTaskIds
}: {
  supabase: SupabaseClient;
  userId: string;
  status: ActivationTaskStatus;
  orderedTaskIds: string[];
}) => {
  if (orderedTaskIds.length === 0) {
    return;
  }

  const uniqueTaskIds = new Set(orderedTaskIds);
  if (uniqueTaskIds.size !== orderedTaskIds.length) {
    throw new ActivationServiceError('Tasks can only appear once in a reorder request.', 400);
  }

  const { data, error } = await supabase
    .from('user_activation_tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('status', status);
  assertSuccess(error);

  const existingTaskIds = ((data ?? []) as Array<{ id: string }>).map((task) => task.id);
  const existingTaskIdSet = new Set(existingTaskIds);

  if (
    existingTaskIds.length !== orderedTaskIds.length ||
    orderedTaskIds.some((taskId) => !existingTaskIdSet.has(taskId))
  ) {
    throw new ActivationServiceError('Task order is out of date. Refresh and try again.', 409);
  }

  await runInBatches(
    orderedTaskIds.map((taskId, index) => ({
      id: taskId,
      sort_order: buildSequentialSortOrder(index)
    })),
    async (update) => {
      const { error: updateError } = await supabase
        .from('user_activation_tasks')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
        .eq('user_id', userId)
        .eq('status', status);
      assertSuccess(updateError);
    }
  );
};

export const reconcileActivationTasksSafely = async ({
  supabase,
  userId
}: {
  supabase: SupabaseClient;
  userId: string;
}) => {
  try {
    await reconcileActivationTaskStatuses({ supabase, userId });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Activation task reconcile failed:', error);
    }
  }
};
