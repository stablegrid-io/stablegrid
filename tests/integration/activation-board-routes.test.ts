import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createApiProtectionAdminClient,
  createApiProtectionAdminState
} from './support/apiProtectionAdmin';

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

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

const nowIso = () => new Date().toISOString();

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
    db[table] = db[table].filter((row) => !matchesFilters(row, equalsFilters, inFilters));
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
    then(
      resolve: (value: { data: unknown; error: null }) => unknown,
      reject?: (reason: unknown) => unknown
    ) {
      return Promise.resolve(execute()).then(resolve, reject);
    }
  };

  return query;
};

const createSupabaseClient = (db: InMemoryDb, userId = 'user-1') => {
  let taskCounter = db.user_activation_tasks.length + 1;
  let itemCounter = db.user_activation_task_items.length + 1;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null
      })
    },
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

          return {
            select(_columns: string) {
              return {
                async single() {
                  return { data: inserted[0], error: null };
                }
              };
            },
            then(
              resolve: (value: { data: Row[]; error: null }) => unknown,
              reject?: (reason: unknown) => unknown
            ) {
              return Promise.resolve({ data: inserted, error: null }).then(resolve, reject);
            }
          };
        },
        update(payload: Row) {
          return createQuery(db, table, 'update', null, payload);
        },
        delete() {
          return createQuery(db, table, 'delete', null, null);
        }
      };
    }
  };
};

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T;
  return payload;
};

describe('activation board API routes', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    createAdminClientMock.mockReset();
    createAdminClientMock.mockReturnValue(
      createApiProtectionAdminClient(createApiProtectionAdminState())
    );
  });

  it('POST /api/activation-tasks creates a theory count task with linked next items', async () => {
    const db = createDb();
    db.content_items.push(
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
    db.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-01',
      is_completed: true
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { POST } = await import('@/app/api/activation-tasks/route');

    const response = await POST(
      new Request('http://localhost/api/activation-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'theory',
          taskGroup: 'theory',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 2
        })
      })
    );

    expect(response.status).toBe(201);
    const payload = await parseJson<{
      data: {
        created: {
          id: string;
          title: string;
          progress: { total: number };
        } | null;
      };
    }>(response);

    expect(payload.data.created).not.toBeNull();
    expect(payload.data.created?.title).toBe('Complete 2 PySpark modules');
    expect(payload.data.created?.progress.total).toBe(2);
    const linkedItems = db.user_activation_task_items.filter(
      (row) => row.activation_task_id === payload.data.created?.id
    );
    expect(linkedItems.map((row) => row.content_item_id)).toEqual(['content-2', 'content-3']);
  });

  it('POST /api/activation-tasks returns 422 when requested count exceeds remaining', async () => {
    const db = createDb();
    db.content_items.push({
      id: 'content-1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-01',
      title: 'Module 1',
      sequence_order: 1,
      is_active: true
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { POST } = await import('@/app/api/activation-tasks/route');

    const response = await POST(
      new Request('http://localhost/api/activation-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'theory',
          taskGroup: 'theory',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 3
        })
      })
    );

    expect(response.status).toBe(422);
    const payload = await parseJson<{ error: string; remainingCount: number }>(response);
    expect(payload.remainingCount).toBe(1);
    expect(payload.error).toContain('Only 1 eligible item(s) remain');
  });

  it('POST /api/activation-tasks creates global mission tasks without track selection', async () => {
    const db = createDb();
    db.content_items.push(
      {
        id: 'mission-1',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'blackout-berlin',
        title: 'BLACKOUT BERLIN',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'mission-2',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'solar-surge',
        title: 'SOLAR SURGE',
        sequence_order: 2,
        is_active: true
      }
    );
    db.user_missions.push({
      user_id: 'user-1',
      mission_slug: 'blackout-berlin',
      state: 'completed'
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { POST } = await import('@/app/api/activation-tasks/route');

    const response = await POST(
      new Request('http://localhost/api/activation-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'task',
          taskGroup: 'missions',
          scopeType: 'all_remaining'
        })
      })
    );

    expect(response.status).toBe(201);
    const payload = await parseJson<{
      data: {
        created: { title: string; trackSlug: string | null; progress: { total: number } } | null;
      };
    }>(response);

    expect(payload.data.created?.title).toBe('Complete all remaining missions');
    expect(payload.data.created?.trackSlug).toBeNull();
    expect(payload.data.created?.progress.total).toBe(1);
  });

  it('GET /api/activation-board returns grouped columns after reconcile', async () => {
    const db = createDb();
    db.content_items.push(
      {
        id: 'theory-item-1',
        track_id: 'track-pyspark',
        content_type: 'theory_module',
        source_ref: 'module-01',
        title: 'Module 1',
        sequence_order: 1,
        is_active: true
      },
      {
        id: 'mission-item-1',
        track_id: 'track-global',
        content_type: 'mission',
        source_ref: 'ghost-regulator',
        title: 'GHOST REGULATOR',
        sequence_order: 1,
        is_active: true
      }
    );
    db.user_activation_tasks.push(
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
        id: 'task-mission',
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
      }
    );
    db.user_activation_task_items.push(
      {
        id: 'item-theory',
        user_id: 'user-1',
        activation_task_id: 'task-theory',
        content_item_id: 'theory-item-1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-mission',
        user_id: 'user-1',
        activation_task_id: 'task-mission',
        content_item_id: 'mission-item-1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    db.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-01',
      is_completed: true
    });
    db.user_missions.push({
      user_id: 'user-1',
      mission_slug: 'ghost-regulator',
      state: 'in_progress'
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { GET } = await import('@/app/api/activation-board/route');

    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await parseJson<{
      data: {
        todo: Array<{ id: string }>;
        inProgress: Array<{ id: string }>;
        completed: Array<{ id: string }>;
      };
    }>(response);

    expect(payload.data.todo).toHaveLength(0);
    expect(payload.data.inProgress.map((task) => task.id).sort()).toEqual([
      'task-mission',
      'task-theory'
    ]);
    expect(payload.data.completed).toHaveLength(0);
  });

  it('PATCH /api/activation-tasks/:id/start transitions todo task to in_progress', async () => {
    const db = createDb();
    db.content_items.push(
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
      }
    );
    db.user_activation_tasks.push({
      id: 'task-1',
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
    db.user_activation_task_items.push(
      {
        id: 'item-1',
        user_id: 'user-1',
        activation_task_id: 'task-1',
        content_item_id: 'content-1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-2',
        user_id: 'user-1',
        activation_task_id: 'task-1',
        content_item_id: 'content-2',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { PATCH } = await import('@/app/api/activation-tasks/[id]/start/route');

    const response = await PATCH(
      new Request('http://localhost/api/activation-tasks/task-1/start', {
        method: 'PATCH'
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(200);
    const payload = await parseJson<{
      data: { task: { status: string } | null };
    }>(response);

    expect(payload.data.task?.status).toBe('in_progress');
    const task = db.user_activation_tasks.find((row) => row.id === 'task-1');
    expect(task?.status).toBe('in_progress');
    const item = db.user_activation_task_items.find((row) => row.id === 'item-1');
    expect(item?.item_status).toBe('in_progress');
  });

  it('PATCH /api/activation-tasks/:id/start replays duplicate requests without advancing a second item', async () => {
    const db = createDb();
    db.content_items.push(
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
      }
    );
    db.user_activation_tasks.push({
      id: 'task-1',
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
    db.user_activation_task_items.push(
      {
        id: 'item-1',
        user_id: 'user-1',
        activation_task_id: 'task-1',
        content_item_id: 'content-1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-2',
        user_id: 'user-1',
        activation_task_id: 'task-1',
        content_item_id: 'content-2',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    const adminState = createApiProtectionAdminState();
    createClientMock.mockReturnValue(client);
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    const { PATCH } = await import('@/app/api/activation-tasks/[id]/start/route');

    const request = () =>
      new Request('http://localhost/api/activation-tasks/task-1/start', {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': 'activation-task-start-key-1234',
          'x-forwarded-for': '203.0.113.41'
        }
      });

    const firstResponse = await PATCH(request(), { params: { id: 'task-1' } });
    const secondResponse = await PATCH(request(), { params: { id: 'task-1' } });

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(await firstResponse.json()).toEqual(await secondResponse.json());

    const inProgressItems = db.user_activation_task_items.filter(
      (row) => row.activation_task_id === 'task-1' && row.item_status === 'in_progress'
    );
    const todoItems = db.user_activation_task_items.filter(
      (row) => row.activation_task_id === 'task-1' && row.item_status === 'todo'
    );

    expect(inProgressItems).toHaveLength(1);
    expect(todoItems).toHaveLength(1);
  });

  it('PATCH /api/activation-tasks/:id/todo transitions in_progress task to todo', async () => {
    const db = createDb();
    db.content_items.push({
      id: 'content-1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-01',
      title: 'Module 1',
      sequence_order: 1,
      is_active: true
    });
    db.user_activation_tasks.push({
      id: 'task-1',
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
    db.user_activation_task_items.push({
      id: 'item-1',
      user_id: 'user-1',
      activation_task_id: 'task-1',
      content_item_id: 'content-1',
      item_status: 'in_progress',
      started_at: nowIso(),
      completed_at: null
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { PATCH } = await import('@/app/api/activation-tasks/[id]/todo/route');

    const response = await PATCH(
      new Request('http://localhost/api/activation-tasks/task-1/todo', {
        method: 'PATCH'
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(200);
    const payload = await parseJson<{
      data: { task: { status: string } | null };
    }>(response);

    expect(payload.data.task?.status).toBe('todo');
    const task = db.user_activation_tasks.find((row) => row.id === 'task-1');
    expect(task?.status).toBe('todo');
    const item = db.user_activation_task_items.find((row) => row.id === 'item-1');
    expect(item?.item_status).toBe('todo');
  });

  it('PATCH /api/activation-tasks/:id/completed transitions unlocked in_progress task to completed', async () => {
    const db = createDb();
    db.content_items.push({
      id: 'content-1',
      track_id: 'track-pyspark',
      content_type: 'theory_module',
      source_ref: 'module-01',
      title: 'Module 1',
      sequence_order: 1,
      is_active: true
    });
    db.user_activation_tasks.push({
      id: 'task-1',
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
    db.user_activation_task_items.push({
      id: 'item-1',
      user_id: 'user-1',
      activation_task_id: 'task-1',
      content_item_id: 'content-1',
      item_status: 'completed',
      started_at: nowIso(),
      completed_at: nowIso()
    });
    db.module_progress.push({
      user_id: 'user-1',
      module_id: 'module-01',
      is_completed: true
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { PATCH } = await import('@/app/api/activation-tasks/[id]/completed/route');

    const response = await PATCH(
      new Request('http://localhost/api/activation-tasks/task-1/completed', {
        method: 'PATCH'
      }),
      { params: { id: 'task-1' } }
    );

    expect(response.status).toBe(200);
    const payload = await parseJson<{
      data: { task: { status: string } | null };
    }>(response);

    expect(payload.data.task?.status).toBe('completed');
    const task = db.user_activation_tasks.find((row) => row.id === 'task-1');
    expect(task?.status).toBe('completed');
    expect(task?.completed_at).toBeTruthy();
  });

  it('PATCH /api/activation-tasks/:id edits a todo task using structured payload', async () => {
    const db = createDb();
    db.content_items.push(
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
    db.user_activation_tasks.push({
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
    db.user_activation_task_items.push({
      id: 'item-edit-1',
      user_id: 'user-1',
      activation_task_id: 'task-edit-1',
      content_item_id: 'content-1',
      item_status: 'todo',
      started_at: null,
      completed_at: null
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { PATCH } = await import('@/app/api/activation-tasks/[id]/route');

    const response = await PATCH(
      new Request('http://localhost/api/activation-tasks/task-edit-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'theory',
          taskGroup: 'theory',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 2
        })
      }),
      { params: { id: 'task-edit-1' } }
    );

    expect(response.status).toBe(200);
    const updatedTask = db.user_activation_tasks.find((row) => row.id === 'task-edit-1');
    expect(updatedTask?.title).toBe('Complete 2 PySpark modules');
    expect(updatedTask?.requested_count).toBe(2);
    expect(
      db.user_activation_task_items.filter((row) => row.activation_task_id === 'task-edit-1')
    ).toHaveLength(2);
  });

  it('PATCH /api/activation-tasks/reorder persists task order inside a column', async () => {
    const db = createDb();
    db.user_activation_tasks.push(
      {
        id: 'task-1',
        user_id: 'user-1',
        task_type: 'theory',
        task_group: 'theory',
        title: 'Complete 2 selected modules',
        description: 'Continue through these selected theory modules in your track.',
        scope_type: 'count',
        requested_count: 2,
        status: 'todo',
        sort_order: 1000,
        track_id: 'track-pyspark',
        created_at: '2026-03-13T08:00:00.000Z',
        started_at: null,
        completed_at: null
      },
      {
        id: 'task-2',
        user_id: 'user-1',
        task_type: 'theory',
        task_group: 'theory',
        title: 'Complete Module 8: Complex Data Types',
        description: 'Continue through this theory module in your track.',
        scope_type: 'count',
        requested_count: 1,
        status: 'todo',
        sort_order: 2000,
        track_id: 'track-pyspark',
        created_at: '2026-03-13T09:00:00.000Z',
        started_at: null,
        completed_at: null
      }
    );
    db.user_activation_task_items.push(
      {
        id: 'item-1',
        user_id: 'user-1',
        activation_task_id: 'task-1',
        content_item_id: 'content-1',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      },
      {
        id: 'item-2',
        user_id: 'user-1',
        activation_task_id: 'task-2',
        content_item_id: 'content-2',
        item_status: 'todo',
        started_at: null,
        completed_at: null
      }
    );
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { PATCH } = await import('@/app/api/activation-tasks/reorder/route');

    const response = await PATCH(
      new Request('http://localhost/api/activation-tasks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'todo',
          orderedTaskIds: ['task-2', 'task-1']
        })
      })
    );

    expect(response.status).toBe(200);
    const payload = await parseJson<{
      data: {
        board: {
          todo: Array<{ id: string }>;
        };
      };
    }>(response);

    expect(payload.data.board.todo.map((task) => task.id)).toEqual(['task-2', 'task-1']);
    expect(db.user_activation_tasks.find((row) => row.id === 'task-2')?.sort_order).toBe(1000);
    expect(db.user_activation_tasks.find((row) => row.id === 'task-1')?.sort_order).toBe(2000);
  });

  it('DELETE /api/activation-tasks/:id removes a task and linked items', async () => {
    const db = createDb();
    db.user_activation_tasks.push({
      id: 'task-delete-1',
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
    db.user_activation_task_items.push({
      id: 'item-delete-1',
      user_id: 'user-1',
      activation_task_id: 'task-delete-1',
      content_item_id: 'content-1',
      item_status: 'todo',
      started_at: null,
      completed_at: null
    });
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    createClientMock.mockReturnValue(client);
    const { DELETE } = await import('@/app/api/activation-tasks/[id]/route');

    const response = await DELETE(
      new Request('http://localhost/api/activation-tasks/task-delete-1', {
        method: 'DELETE'
      }),
      { params: { id: 'task-delete-1' } }
    );

    expect(response.status).toBe(200);
    expect(db.user_activation_tasks.find((row) => row.id === 'task-delete-1')).toBeUndefined();
    expect(
      db.user_activation_task_items.find((row) => row.activation_task_id === 'task-delete-1')
    ).toBeUndefined();
  });

  it('POST /api/activation-tasks replays duplicate creates without inserting a second task', async () => {
    const db = createDb();
    db.content_items.push(
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
      }
    );
    db.user_progress.push({
      user_id: 'user-1',
      completed_questions: [],
      topic_progress: {}
    });

    const client = createSupabaseClient(db);
    const adminState = createApiProtectionAdminState();
    createClientMock.mockReturnValue(client);
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    const { POST } = await import('@/app/api/activation-tasks/route');

    const request = () =>
      new Request('http://localhost/api/activation-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'activation-task-create-key-1234',
          'x-forwarded-for': '203.0.113.42'
        },
        body: JSON.stringify({
          taskType: 'theory',
          taskGroup: 'theory',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 2
        })
      });

    const firstResponse = await POST(request());
    const secondResponse = await POST(request());

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(await firstResponse.json()).toEqual(await secondResponse.json());
    expect(db.user_activation_tasks).toHaveLength(1);
    expect(db.user_activation_task_items).toHaveLength(2);
  });
});
