import { describe, expect, it } from 'vitest';
import {
  ActivationServiceError,
  createActivationTask,
  deleteActivationTask,
  editActivationTask,
  getActivationBoardData,
  moveActivationTaskToCompleted,
  moveActivationTaskToTodo,
  reorderActivationTasks,
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
    {
      id: 'track-pyspark-de',
      slug: 'pyspark-data-engineering-track',
      title: 'PySpark: Data Engineering Track',
      is_active: true
    },
    { id: 'track-fabric', slug: 'fabric', title: 'Microsoft Fabric', is_active: true },
    {
      id: 'track-fabric-de',
      slug: 'fabric-data-engineering-track',
      title: 'Fabric: Data Engineering Track',
      is_active: true
    },
    {
      id: 'track-fabric-bi',
      slug: 'fabric-business-intelligence-track',
      title: 'Fabric: Business Intelligence Track',
      is_active: true
    },
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
  inFilters: Array<{ column: string; values: unknown[] }>,
  notEqualsFilters: Array<{ column: string; value: unknown }>
) => {
  const eqMatch = equalsFilters.every(({ column, value }) => row[column] === value);
  const inMatch = inFilters.every(({ column, values }) => values.includes(row[column]));
  const neqMatch = notEqualsFilters.every(({ column, value }) => row[column] !== value);
  return eqMatch && inMatch && neqMatch;
};

const projectRow = (db: InMemoryDb, table: keyof InMemoryDb, row: Row, columns: string) => {
  if (table === 'content_items' && columns.includes('tracks:track_id')) {
    const track = db.tracks.find((entry) => entry.id === row.track_id);
    return {
      ...row,
      tracks: track
        ? { slug: track.slug, title: track.title, is_active: track.is_active }
        : null
    };
  }

  if (table === 'user_activation_tasks') {
    const projected = { ...row };
    if (columns.includes('tracks:track_id')) {
      const track = db.tracks.find((entry) => entry.id === row.track_id);
      projected.tracks = track ? { slug: track.slug, title: track.title } : null;
    }
    if (columns.includes('user_activation_task_items(')) {
      projected.user_activation_task_items = db.user_activation_task_items
        .filter((item) => item.activation_task_id === row.id)
        .map((item) => {
          const projectedItem = { ...item };

          if (columns.includes('content_items(')) {
            const contentItem = db.content_items.find((entry) => entry.id === item.content_item_id);
            projectedItem.content_items = contentItem
              ? {
                  content_type: contentItem.content_type,
                  source_ref: contentItem.source_ref
                }
              : null;
          }

          return projectedItem;
        });
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
  const notEqualsFilters: Array<{ column: string; value: unknown }> = [];
  let orderBy: { column: string; ascending: boolean } | null = null;
  let maxRows: number | null = null;

  const runSelect = () => {
    const rows = db[table]
      .filter((row) => matchesFilters(row, equalsFilters, inFilters, notEqualsFilters))
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
    const rows = db[table].filter((row) =>
      matchesFilters(row, equalsFilters, inFilters, notEqualsFilters)
    );
    rows.forEach((row) => {
      Object.assign(row, updatePayload ?? {});
    });
    return { data: null, error: null };
  };

  const runDelete = () => {
    const retained = db[table].filter(
      (row) => !matchesFilters(row, equalsFilters, inFilters, notEqualsFilters)
    );
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
    neq(column: string, value: unknown) {
      notEqualsFilters.push({ column, value });
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

  it('creates a theory task from explicitly selected modules', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'module-a',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'PySpark Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'module-b',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'PySpark Module 2',
        sequence_order: 2,
        is_active: true
      },
      {
        id: 'module-c',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-03',
        title: 'PySpark Module 3',
        sequence_order: 3,
        is_active: true
      }
    );
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
        scopeType: 'count',
        contentItemIds: ['module-b', 'module-c']
      }
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === created.taskId);
    expect(task?.requested_count).toBe(2);
    expect(task?.title).toBe('Complete 2 selected modules');

    const linkedItems = db.user_activation_task_items.filter(
      (entry) => entry.activation_task_id === created.taskId
    );
    expect(linkedItems).toHaveLength(2);
    expect(linkedItems[0].content_item_id).toBe('module-b');
    expect(linkedItems[1].content_item_id).toBe('module-c');
  });

  it('supports explicit theory selections with more than three modules', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'module-a',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'PySpark Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'module-b',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'PySpark Module 2',
        sequence_order: 2,
        is_active: true
      },
      {
        id: 'module-c',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-03',
        title: 'PySpark Module 3',
        sequence_order: 3,
        is_active: true
      },
      {
        id: 'module-d',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-04',
        title: 'PySpark Module 4',
        sequence_order: 4,
        is_active: true
      }
    );
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
        scopeType: 'count',
        contentItemIds: ['module-a', 'module-b', 'module-c', 'module-d']
      }
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === created.taskId);
    expect(task?.requested_count).toBe(4);

    const linkedItems = db.user_activation_task_items.filter(
      (entry) => entry.activation_task_id === created.taskId
    );
    expect(linkedItems).toHaveLength(4);
  });

  it('does not allow reselecting modules already linked to prior theory tasks', async () => {
    const seed = createDb();
    seed.content_items.push(
      {
        id: 'module-a',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'PySpark Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'module-b',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-02',
        title: 'PySpark Module 2',
        sequence_order: 2,
        is_active: true
      }
    );
    seed.user_activation_tasks.push({
      id: 'old-theory-task',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete PySpark Module 1',
      description: 'Continue through this theory module in your track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'completed',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: nowIso(),
      completed_at: nowIso()
    });
    seed.user_activation_task_items.push({
      id: 'old-theory-item',
      user_id: 'user-1',
      activation_task_id: 'old-theory-task',
      content_item_id: 'module-a',
      item_status: 'completed',
      started_at: nowIso(),
      completed_at: nowIso()
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
          scopeType: 'count',
          contentItemIds: ['module-a']
        }
      })
    ).rejects.toMatchObject({ status: 422 });

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
      (entry) => entry.activation_task_id === created.taskId
    );
    expect(linkedItems).toHaveLength(1);
    expect(linkedItems[0].content_item_id).toBe('module-b');
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
    ).toBe('in_progress');
    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-flashcard')?.status
    ).toBe('in_progress');
    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-notebook')?.status
    ).toBe('in_progress');
    expect(
      db.user_activation_tasks.find((entry) => entry.id === 'task-theory')?.completed_at
    ).toBeNull();
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
    expect(task?.status).toBe('in_progress');
    expect(item?.item_status).toBe('completed');
    expect(task?.completed_at).toBeNull();
    expect(item?.completed_at).toBeTruthy();
  });

  it('preserves completed task status during reconcile after the user finishes the drag-to-complete step', async () => {
    const seed = createDb();
    seed.content_items.push({
      id: 'module-ready-1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-06',
      title: 'Module 6',
      sequence_order: 6,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'task-done-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'completed',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: nowIso(),
      completed_at: nowIso()
    });
    seed.user_activation_task_items.push({
      id: 'task-done-item-1',
      user_id: 'user-1',
      activation_task_id: 'task-done-1',
      content_item_id: 'module-ready-1',
      item_status: 'completed',
      started_at: nowIso(),
      completed_at: nowIso()
    });
    seed.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-06',
      is_completed: true
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await reconcileActivationTaskStatuses({ supabase: client, userId: 'user-1' });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-done-1');
    expect(task?.status).toBe('completed');
    expect(task?.completed_at).toBeTruthy();
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

  it('edits an in_progress task without locking the edit flow to To Do only', async () => {
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
      id: 'task-edit-in-progress-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'in_progress',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: nowIso(),
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'task-edit-in-progress-item-1',
      user_id: 'user-1',
      activation_task_id: 'task-edit-in-progress-1',
      content_item_id: 'module-1',
      item_status: 'in_progress',
      started_at: nowIso(),
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
      taskId: 'task-edit-in-progress-1',
      input: {
        taskType: 'theory',
        taskGroup: 'theory',
        trackSlug: 'pyspark',
        scopeType: 'count',
        requestedCount: 2
      }
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-edit-in-progress-1');
    expect(task?.title).toBe('Complete 2 PySpark modules');
    expect(task?.requested_count).toBe(2);
    expect(task?.status).toBe('in_progress');
    expect(task?.started_at).toBeTruthy();

    const items = db.user_activation_task_items.filter(
      (entry) => entry.activation_task_id === 'task-edit-in-progress-1'
    );
    expect(items).toHaveLength(2);
    expect(items.every((entry) => entry.item_status === 'todo')).toBe(true);
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

  it('moves an in_progress task back to todo when it has no completed progress', async () => {
    const seed = createDb();
    seed.content_items.push({
      id: 'c1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-01',
      title: 'Module 1',
      sequence_order: 1,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'task-move-back-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'in_progress',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: nowIso(),
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'item-move-back-1',
      user_id: 'user-1',
      activation_task_id: 'task-move-back-1',
      content_item_id: 'c1',
      item_status: 'in_progress',
      started_at: nowIso(),
      completed_at: null
    });

    const { client, db } = createSupabase(seed);
    await moveActivationTaskToTodo({
      supabase: client,
      userId: 'user-1',
      taskId: 'task-move-back-1'
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-move-back-1');
    expect(task?.status).toBe('todo');
    expect(task?.started_at).toBeNull();
    expect(task?.completed_at).toBeNull();

    const item = db.user_activation_task_items.find((entry) => entry.id === 'item-move-back-1');
    expect(item?.item_status).toBe('todo');
    expect(item?.started_at).toBeNull();
    expect(item?.completed_at).toBeNull();
  });

  it('moves an unlocked in_progress task to completed after all linked items are done', async () => {
    const seed = createDb();
    seed.content_items.push({
      id: 'c-ready-1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-07',
      title: 'Module 7',
      sequence_order: 7,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'task-move-complete-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'in_progress',
      track_id: 'track-pyspark',
      created_at: nowIso(),
      started_at: nowIso(),
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'item-move-complete-1',
      user_id: 'user-1',
      activation_task_id: 'task-move-complete-1',
      content_item_id: 'c-ready-1',
      item_status: 'completed',
      started_at: nowIso(),
      completed_at: nowIso()
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client, db } = createSupabase(seed);
    await moveActivationTaskToCompleted({
      supabase: client,
      userId: 'user-1',
      taskId: 'task-move-complete-1'
    });

    const task = db.user_activation_tasks.find((entry) => entry.id === 'task-move-complete-1');
    expect(task?.status).toBe('completed');
    expect(task?.completed_at).toBeTruthy();
  });

  it('reorders tasks inside the same status column', async () => {
    const seed = createDb();
    seed.user_activation_tasks.push(
      {
        id: 'task-1',
        user_id: 'user-1',
        status: 'todo',
        sort_order: 1000,
        created_at: '2026-03-13T08:00:00.000Z'
      },
      {
        id: 'task-2',
        user_id: 'user-1',
        status: 'todo',
        sort_order: 2000,
        created_at: '2026-03-13T09:00:00.000Z'
      },
      {
        id: 'task-3',
        user_id: 'user-1',
        status: 'todo',
        sort_order: 3000,
        created_at: '2026-03-13T10:00:00.000Z'
      }
    );

    const { client, db } = createSupabase(seed);

    await reorderActivationTasks({
      supabase: client,
      userId: 'user-1',
      status: 'todo',
      orderedTaskIds: ['task-3', 'task-1', 'task-2']
    });

    const orderedTasks = db.user_activation_tasks
      .filter((entry) => entry.status === 'todo')
      .sort((left, right) => left.sort_order - right.sort_order);

    expect(orderedTasks.map((entry) => entry.id)).toEqual(['task-3', 'task-1', 'task-2']);
    expect(orderedTasks.map((entry) => entry.sort_order)).toEqual([1000, 2000, 3000]);
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

  it('surfaces Fabric subtracks in the board catalog and builds track-aware theory links', async () => {
    const seed = createDb();
    seed.content_items.push({
      id: 'fabric-de-module-1',
      track_id: 'track-fabric-de',
      content_type: 'theory_module',
      source_ref: 'module-F1',
      title: 'Platform Foundations & Architecture',
      sequence_order: 1,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'task-fabric-de-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete Platform Foundations & Architecture',
      description: 'Continue through this theory module in your track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'in_progress',
      sort_order: 1000,
      track_id: 'track-fabric-de',
      created_at: '2026-03-19T10:00:00.000Z',
      started_at: '2026-03-19T10:05:00.000Z',
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'task-item-fabric-de-1',
      user_id: 'user-1',
      activation_task_id: 'task-fabric-de-1',
      content_item_id: 'fabric-de-module-1',
      item_status: 'in_progress',
      started_at: '2026-03-19T10:05:00.000Z',
      completed_at: null,
      created_at: '2026-03-19T10:05:00.000Z',
      updated_at: '2026-03-19T10:05:00.000Z'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client } = createSupabase(seed);
    const board = await getActivationBoardData({
      supabase: client,
      userId: 'user-1',
      shouldReconcile: false
    });

    expect(board.catalog.tracks.map((track) => track.slug)).toEqual([
      'fabric',
      'fabric-business-intelligence-track',
      'fabric-data-engineering-track',
      'pyspark',
      'pyspark-data-engineering-track'
    ]);
    expect(board.inProgress[0]?.trackSlug).toBe('fabric-data-engineering-track');
    expect(board.inProgress[0]?.actionHref).toBe(
      '/learn/fabric/theory/data-engineering-track?chapter=module-F1'
    );
  });

  it('routes airflow theory tasks through the beginner track path', async () => {
    const seed = createDb();
    seed.tracks.push({
      id: 'track-airflow',
      slug: 'airflow',
      title: 'Apache Airflow',
      is_active: true
    });
    seed.content_items.push({
      id: 'airflow-module-1',
      track_id: 'track-airflow',
      content_type: 'theory_module',
      source_ref: 'module-01',
      title: 'What Is Airflow?',
      sequence_order: 1,
      is_active: true
    });
    seed.user_activation_tasks.push({
      id: 'task-airflow-1',
      user_id: 'user-1',
      task_type: 'theory',
      task_group: 'theory',
      title: 'Complete What Is Airflow?',
      description: 'Continue through this theory module in your track.',
      scope_type: 'count',
      requested_count: 1,
      status: 'in_progress',
      sort_order: 1000,
      track_id: 'track-airflow',
      created_at: '2026-03-19T10:00:00.000Z',
      started_at: '2026-03-19T10:05:00.000Z',
      completed_at: null
    });
    seed.user_activation_task_items.push({
      id: 'task-item-airflow-1',
      user_id: 'user-1',
      activation_task_id: 'task-airflow-1',
      content_item_id: 'airflow-module-1',
      item_status: 'in_progress',
      started_at: '2026-03-19T10:05:00.000Z',
      completed_at: null,
      created_at: '2026-03-19T10:05:00.000Z',
      updated_at: '2026-03-19T10:05:00.000Z'
    });
    seed.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const { client } = createSupabase(seed);
    const board = await getActivationBoardData({
      supabase: client,
      userId: 'user-1',
      shouldReconcile: false
    });

    expect(board.inProgress[0]?.trackSlug).toBe('airflow');
    expect(board.inProgress[0]?.actionHref).toBe(
      '/learn/airflow/theory/beginner-track?chapter=module-01'
    );
  });
});
