import { describe, expect, it } from 'vitest';
import {
  ActivationServiceError,
  createActivationTask,
  deleteActivationTask,
  editActivationTask,
  reconcileActivationTaskStatuses,
  startActivationTask
} from '@/lib/activation/service';

type Row = Record<string, any>;

interface InMemoryDb {
  tracks: Row[];
  content_items: Row[];
  module_progress: Row[];
  reading_sessions: Row[];
  user_progress: Row[];
  user_missions: Row[];
  user_activation_tasks: Row[];
  user_activation_task_items: Row[];
}

const nowIso = () => new Date().toISOString();

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createDb = (): InMemoryDb => ({
  tracks: [
    { id: 'track-pyspark', slug: 'pyspark', title: 'PySpark', is_active: true },
    { id: 'track-fabric', slug: 'fabric', title: 'Microsoft Fabric', is_active: true },
    { id: 'track-global', slug: 'global', title: 'Global', is_active: true }
  ],
  content_items: [],
  module_progress: [],
  reading_sessions: [],
  user_progress: [],
  user_missions: [],
  user_activation_tasks: [],
  user_activation_task_items: []
});

const matchesFilters = (
  row: Row,
  equalsFilters: Array<{ column: string; value: unknown }>,
  inFilters: Array<{ column: string; values: unknown[] }>
) => {
  const eqMatch = equalsFilters.every(({ column, value }) => row[column] === value);
  const inMatch = inFilters.every(({ column, values }) => values.includes(row[column]));
  return eqMatch && inMatch;
};

const projectRow = (db: InMemoryDb, table: keyof InMemoryDb, row: Row, columns: string) => {
  if (table === 'user_activation_tasks') {
    const projected = { ...row };
    if (columns.includes('tracks:track_id')) {
      const track = db.tracks.find((entry) => entry.id === row.track_id);
      projected.tracks = track ? { slug: track.slug, title: track.title } : null;
    }
    if (columns.includes('user_activation_task_items(')) {
      projected.user_activation_task_items = db.user_activation_task_items
        .filter((item) => item.activation_task_id === row.id)
        .map((item) => ({ ...item }));
    }
    return projected;
  }

  if (table === 'user_activation_task_items' && columns.includes('content_items(')) {
    const projected = { ...row };
    const contentItem = db.content_items.find((entry) => entry.id === row.content_item_id);
    projected.content_items = contentItem
      ? {
          content_type: contentItem.content_type,
          source_ref: contentItem.source_ref
        }
      : null;
    return projected;
  }

  return { ...row };
};

const createQuery = (
  db: InMemoryDb,
  table: keyof InMemoryDb,
  operation: 'select' | 'update' | 'delete',
  columns: string | null,
  updatePayload: Row | null
) => {
  const equalsFilters: Array<{ column: string; value: unknown }> = [];
  const inFilters: Array<{ column: string; values: unknown[] }> = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let maxRows: number | null = null;

  const runSelect = () => {
    const rows = db[table]
      .filter((row) => matchesFilters(row, equalsFilters, inFilters))
      .map((row) => (columns ? projectRow(db, table, row, columns) : { ...row }));

    if (orderBy) {
      const activeOrderBy = orderBy;
      rows.sort((left, right) => {
        if (left[activeOrderBy.column] === right[activeOrderBy.column]) return 0;
        if (left[activeOrderBy.column] > right[activeOrderBy.column]) {
          return activeOrderBy.ascending ? 1 : -1;
        }
        return activeOrderBy.ascending ? -1 : 1;
      });
    }

    if (typeof maxRows === 'number') {
      return rows.slice(0, maxRows);
    }

    return rows;
  };

  const runUpdate = () => {
    const rows = db[table].filter((row) => matchesFilters(row, equalsFilters, inFilters));
    rows.forEach((row) => {
      Object.assign(row, updatePayload ?? {});
    });
    return { data: null, error: null };
  };

  const runDelete = () => {
    const retained = db[table].filter((row) => !matchesFilters(row, equalsFilters, inFilters));
    db[table] = retained;
    return { data: null, error: null };
  };

  const execute = () => {
    if (operation === 'select') {
      return { data: runSelect(), error: null };
    }
    if (operation === 'update') {
      return runUpdate();
    }
    return runDelete();
  };

  const query: any = {
    eq(column: string, value: unknown) {
      equalsFilters.push({ column, value });
      return query;
    },
    in(column: string, values: unknown[]) {
      inFilters.push({ column, values });
      return query;
    },
    order(column: string, options: { ascending: boolean }) {
      orderBy = { column, ascending: options.ascending };
      return query;
    },
    limit(value: number) {
      maxRows = value;
      return query;
    },
    async maybeSingle() {
      const result = execute();
      return {
        data: (result.data as Row[])[0] ?? null,
        error: result.error
      };
    },
    async single() {
      const result = execute();
      const row = (result.data as Row[])[0] ?? null;
      if (!row) {
        return { data: null, error: { message: 'No rows.' } };
      }
      return { data: row, error: null };
    },
    then(resolve: (value: { data: unknown; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(execute()).then(resolve, reject);
    }
  };

  return query;
};

const createSupabase = (initialDb: InMemoryDb) => {
  const db = clone(initialDb);
  let taskCounter = db.user_activation_tasks.length + 1;
  let itemCounter = db.user_activation_task_items.length + 1;

  return {
    db,
    client: {
      from(table: keyof InMemoryDb) {
        return {
          select(columns: string) {
            return createQuery(db, table, 'select', columns, null);
          },
          insert(payload: Row | Row[]) {
            const rows = Array.isArray(payload) ? payload : [payload];
            const inserted = rows.map((row) => {
              if (table === 'user_activation_tasks') {
                return {
                  id: row.id ?? `task-${taskCounter++}`,
                  created_at: row.created_at ?? nowIso(),
                  updated_at: row.updated_at ?? nowIso(),
                  started_at: row.started_at ?? null,
                  completed_at: row.completed_at ?? null,
                  ...row
                };
              }

              if (table === 'user_activation_task_items') {
                return {
                  id: row.id ?? `item-${itemCounter++}`,
                  created_at: row.created_at ?? nowIso(),
                  updated_at: row.updated_at ?? nowIso(),
                  started_at: row.started_at ?? null,
                  completed_at: row.completed_at ?? null,
                  ...row
                };
              }

              return { ...row };
            });

            db[table].push(...inserted);

            const insertResult: any = {
              select(_columns: string) {
                return {
                  async single() {
                    return { data: inserted[0], error: null };
                  }
                };
              },
              then(resolve: (value: { data: Row[]; error: null }) => unknown, reject?: (reason: unknown) => unknown) {
                return Promise.resolve({ data: inserted, error: null }).then(resolve, reject);
              }
            };

            return insertResult;
          },
          update(payload: Row) {
            return createQuery(db, table, 'update', null, payload);
          },
          delete() {
            return createQuery(db, table, 'delete', null, null);
          }
        };
      }
    }
  };
};

describe('activation service', () => {
  it('creates a task using eligible next content items only', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'content-1',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'content-2',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'Module 2',
        sequence_order: 2,
        is_active: true
      },
      {
        id: 'content-3',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-03',
        title: 'Module 3',
        sequence_order: 3,
        is_active: true
      }
    );
    seed.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-01',
      is_completed: true
    });
    seed.user_activation_tasks.push({
      id: 'task-existing',
      user_id: 'user-1',
      status: 'todo'
    });
    seed.user_activation_task_items.push({
      id: 'item-existing',
      user_id: 'user-1',
      activation_task_id: 'task-existing',
      content_item_id: 'content-2',
      item_status: 'todo'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);

    await expect(
      createActivationTask({
        supabase: client,
        userId: 'user-1',
        input: {
          taskType: 'theory',
          taskGroup: 'theory',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 3
        }
      })
    ).rejects.toMatchObject({
      status: 422
    });

    const created = await createActivationTask({
      supabase: client,
      userId: 'user-1',
      input: {
        taskType: 'theory',
        taskGroup: 'theory',
        trackSlug: 'pyspark',
        scopeType: 'count',
        requestedCount: 1
      }
    });

    expect(created.linkedCount).toBe(1);
    const newTask = db.user_activation_tasks.find((task) => task.id === created.taskId);
    expect(newTask).toBeDefined();
    if (!newTask) {
      throw new Error('Expected newly created activation task.');
    }
    expect(newTask.title).toContain('Complete 1 PySpark module');
    const linkedItems = db.user_activation_task_items.filter(
      (item) => item.activation_task_id === created.taskId
    );
    expect(linkedItems).toHaveLength(1);
    expect(linkedItems[0].content_item_id).toBe('content-3');
  });

  it('excludes already started source items so new tasks stay in todo', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'content-a',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'content-b',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'Module 2',
        sequence_order: 2,
        is_active: true
      }
    );
    seed.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-01',
      is_completed: false,
      current_lesson_id: 'module-01-lesson-01'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    const created = await createActivationTask({
      supabase: client,
      userId: 'user-1',
      input: {
        taskType: 'theory',
        taskGroup: 'theory',
        trackSlug: 'pyspark',
        scopeType: 'count',
        requestedCount: 1
      }
    });

    const linkedItems = db.user_activation_task_items.filter(
      (item) => item.activation_task_id === created.taskId
    );
    expect(linkedItems).toHaveLength(1);
    expect(linkedItems[0].content_item_id).toBe('content-b');
    expect(db.user_activation_tasks.find((task) => task.id === created.taskId)?.status).toBe(
      'todo'
    );
  });

  it('creates all remaining mission items when scope is all_remaining', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'mission-1',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'blackout-berlin',
        title: 'Blackout Berlin',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'mission-2',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'solar-surge',
        title: 'Solar Surge',
        sequence_order: 2,
        is_active: true
      },
      {
        id: 'mission-3',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'ghost-regulator',
        title: 'Ghost Regulator',
        sequence_order: 3,
        is_active: true
      }
    );
    seed.user_missions.push({
      user_id: 'user-1',
      mission_slug: 'blackout-berlin',
      state: 'completed'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    const created = await createActivationTask({
      supabase: client,
      userId: 'user-1',
      input: {
        taskType: 'task',
        taskGroup: 'missions',
        scopeType: 'all_remaining'
      }
    });

    expect(created.linkedCount).toBe(2);
    const linkedItems = db.user_activation_task_items.filter(
      (item) => item.activation_task_id === created.taskId
    );
    expect(linkedItems.map((item) => item.content_item_id)).toEqual(['mission-2', 'mission-3']);
  });

  it('reconciles theory, flashcard, and notebook statuses from source-of-truth progress', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'content-theory',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-05',
        title: 'Module 5',
        sequence_order: 5,
        is_active: true
      },
      {
        id: 'content-flashcard',
        track_id: 'track-pyspark',
        content_type: 'flashcard',
        source_ref: 'pyspark-m05-001',
        title: 'Flashcard 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'content-notebook',
        track_id: 'track-fabric',
        content_type: 'notebook',
        source_ref: 'nb-001',
        title: 'Notebook 1',
        sequence_order: 1,
        is_active: true
      }
    );
    seed.user_activation_tasks.push(
      {
        id: 'task-theory',
        user_id: 'user-1',
        task_type: 'theory',
        task_group: 'theory',
        title: 'Complete 1 PySpark module',
        description: 'Continue through the next theory units in this track.',
        scope_type: 'count',
        requested_count: 1,
        status: 'todo',
        track_id: 'track-pyspark',
        created_at: nowIso(),
        started_at: null,
        completed_at: null
      },
      {
        id: 'task-flashcard',
        user_id: 'user-1',
        task_type: 'task',
        task_group: 'flashcards',
        title: 'Complete 1 PySpark flashcard',
        description: 'Apply your learning through guided practical work.',
        scope_type: 'count',
        requested_count: 1,
        status: 'todo',
        track_id: 'track-pyspark',
        created_at: nowIso(),
        started_at: null,
        completed_at: null
      },
      {
        id: 'task-notebook',
        user_id: 'user-1',
        task_type: 'task',
        task_group: 'notebooks',
        title: 'Complete 1 Microsoft Fabric notebook',
        description: 'Apply your learning through guided practical work.',
        scope_type: 'count',
        requested_count: 1,
        status: 'todo',
        track_id: 'track-fabric',
        created_at: nowIso(),
        started_at: null,
        completed_at: null
      }
    );
    seed.user_activation_task_items.push(
      {
        id: 'item-theory',
        user_id: 'user-1',
        activation_task_id: 'task-theory',
        content_item_id: 'content-theory',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-flashcard',
        user_id: 'user-1',
        activation_task_id: 'task-flashcard',
        content_item_id: 'content-flashcard',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-notebook',
        user_id: 'user-1',
        activation_task_id: 'task-notebook',
        content_item_id: 'content-notebook',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    seed.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-05',
      is_completed: true
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: ['pyspark-m05-001'],
      topic_progress: {
        notebooks: {
          completed_notebook_ids: ['nb-001']
        }
      }
    });

    const { client, db } = createSupabase(seed);
    await reconcileActivationTaskStatuses({ supabase: client, userId: 'user-1' });

    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-theory')?.status
    ).toBe('completed');
    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-flashcard')?.status
    ).toBe('completed');
    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-notebook')?.status
    ).toBe('completed');
  });

  it('reconciles task and item status from source-of-truth mission progress', async () => {
    const seed = createDb();
    seed.content_items.push({
      id: 'mission-content-1',
      track_id: 'track-global',
      content_type: 'mission',
      source_ref: 'ghost-regulator',
      title: 'Ghost Regulator',
      sequence_order: 1,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'mission-task-1',
      user_id: 'user-1',
      task_type: 'task',
      task_group: 'missions',
      title: 'Complete 1 mission',
      description: 'Apply your learning through guided practical work.',
      scope_type: 'count',
      requested_count: 1,
      status: 'todo',
      track_id: null,
      created_at: nowIso(),
      started_at: null,
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'mission-item-1',
      user_id: 'user-1',
      activation_task_id: 'mission-task-1',
      content_item_id: 'mission-content-1',
      item_status: 'todo',
      started_at: null,
      completed_at: null
    });
    seed.user_missions.push({
      user_id: 'user-1',
      mission_slug: 'ghost-regulator',
      state: 'completed'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await reconcileActivationTaskStatuses({ supabase: client, userId: 'user-1' });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'mission-task-1');
    const item = db.user_activation_task_items.find((entry) => entry.id === 'mission-item-1');
    expect(task?.status).toBe('completed');
    expect(item?.item_status).toBe('completed');
    expect(task?.completed_at).toBeTruthy();
    expect(item?.completed_at).toBeTruthy();
  });

  it('edits a todo task and rebinds linked content items', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'module-1',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'module-2',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'Module 2',
        sequence_order: 2,
        is_active: true
      },
      {
        id: 'module-3',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-03',
        title: 'Module 3',
        sequence_order: 3,
        is_active: true
      }
    );
    seed.user_activation_tasks.push({
      id: 'task-edit-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'todo',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: null,
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'task-edit-item-1',
      user_id: 'user-1',
      activation_task_id: 'task-edit-1',
      content_item_id: 'module-1',
      item_status: 'todo',
      started_at: null,
      completed_at: null
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await editActivationTask({
      supabase: client,
      userId: 'user-1',
      taskId: 'task-edit-1',
      input: {
        taskType: 'theory',
        taskGroup: 'theory',
        trackSlug: 'pyspark',
        scopeType: 'count',
        requestedCount: 2
      }
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-edit-1');
    expect(task?.title).toBe('Complete 2 PySpark modules');
    expect(task?.requested_count).toBe(2);
    const items = db.user_activation_task_items.filter(
      (entry) => entry.activation_task_id === 'task-edit-1'
    );
    expect(items).toHaveLength(2);
  });

  it('deletes a task and all linked items', async () => {
    const seed = createDb();
    seed.user_activation_tasks.push({
      id: 'task-delete-1',
      user_id: 'user-1',
      status: 'todo'
    });
    seed.user_activation_task_items.push({
      id: 'task-delete-item-1',
      user_id: 'user-1',
      activation_task_id: 'task-delete-1',
      content_item_id: 'module-1',
      item_status: 'todo'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await deleteActivationTask({
      supabase: client,
      userId: 'user-1',
      taskId: 'task-delete-1'
    });

    expect(db.user_activation_tasks.find((entry) => entry.id === 'task-delete-1')).toBeUndefined();
    expect(
      db.user_activation_task_items.find((entry) => entry.activation_task_id === 'task-delete-1')
    ).toBeUndefined();
  });

  it('starts a todo task and marks the first linked item as in progress', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'c1',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'c2',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'Module 2',
        sequence_order: 2,
        is_active: true
      }
    );
    seed.user_activation_tasks.push({
      id: 'task-start-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 2 PySpark modules',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 2,
      status: 'todo',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: null,
      completed_at: null
    });
    seed.user_activation_task_items.push(
      {
        id: 'item-a',
        user_id: 'user-1',
        activation_task_id: 'task-start-1',
        content_item_id: 'c1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-b',
        user_id: 'user-1',
        activation_task_id: 'task-start-1',
        content_item_id: 'c2',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await startActivationTask({
      supabase: client,
      userId: 'user-1',
      taskId: 'task-start-1'
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-start-1');
    expect(task?.status).toBe('in_progress');
    expect(task?.started_at).toBeTruthy();

    const firstItem = db.user_activation_task_items.find((entry) => entry.id === 'item-a');
    expect(firstItem?.item_status).toBe('in_progress');
    expect(firstItem?.started_at).toBeTruthy();
  });

  it('throws a conflict when trying to start a completed task', async () => {
    const seed = createDb();
    seed.user_activation_tasks.push({
      id: 'done-task',
      user_id: 'user-1',
      status: 'completed',
      started_at: nowIso()
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client } = createSupabase(seed);

    await expect(
      startActivationTask({
        supabase: client,
        userId: 'user-1',
        taskId: 'done-task'
      })
    ).rejects.toMatchObject({
      status: 409
    });
  });
});
