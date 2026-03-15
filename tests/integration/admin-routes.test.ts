import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createApiProtectionAdminClient,
  createApiProtectionAdminState
} from './support/apiProtectionAdmin';

const requireAdminAccessMock = vi.fn();
const createAdminClientMock = vi.fn();
const listAdminAnalyticsMock = vi.fn();
const listAdminFinancialsMock = vi.fn();
const listAdminCustomersMock = vi.fn();
const listAdminBugReportsMock = vi.fn();
const updateAdminBugReportStatusMock = vi.fn();
const listAdminCatalogMock = vi.fn();
const upsertAdminContentItemMock = vi.fn();
const logAdminAuditMock = vi.fn();
const getAdminActivationTaskSnapshotMock = vi.fn();
const getActivationBoardDataMock = vi.fn();
const startActivationTaskMock = vi.fn();
const editActivationTaskMock = vi.fn();

vi.mock('@/lib/admin/access', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/access')>(
    '@/lib/admin/access'
  );

  return {
    ...actual,
    requireAdminAccess: requireAdminAccessMock
  };
});

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock
}));

vi.mock('@/lib/admin/service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/service')>(
    '@/lib/admin/service'
  );

  return {
    ...actual,
    listAdminAnalytics: listAdminAnalyticsMock,
    listAdminFinancials: listAdminFinancialsMock,
    listAdminCustomers: listAdminCustomersMock,
    listAdminBugReports: listAdminBugReportsMock,
    updateAdminBugReportStatus: updateAdminBugReportStatusMock,
    listAdminCatalog: listAdminCatalogMock,
    upsertAdminContentItem: upsertAdminContentItemMock,
    logAdminAudit: logAdminAuditMock,
    getAdminActivationTaskSnapshot: getAdminActivationTaskSnapshotMock
  };
});

vi.mock('@/lib/activation/service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/activation/service')>(
    '@/lib/activation/service'
  );

  return {
    ...actual,
    getActivationBoardData: getActivationBoardDataMock,
    startActivationTask: startActivationTaskMock,
    editActivationTask: editActivationTaskMock
  };
});

const adminSupabase = {};
const accessContext = {
  adminSupabase,
  sessionSupabase: {},
  role: 'super_admin' as const,
  user: {
    id: 'admin-1',
    email: 'admin@stablegrid.io'
  }
};

const baseCatalog = {
  tracks: [
    {
      id: 'track-1',
      slug: 'pyspark',
      title: 'PySpark',
      isActive: true,
      createdAt: '2026-03-14T10:00:00.000Z',
      updatedAt: '2026-03-14T10:00:00.000Z'
    }
  ],
  contentItems: []
};

const baseAnalytics = {
  generatedAt: '2026-03-14T12:00:00.000Z',
  period: 'monthly',
  periodLabel: 'Monthly',
  totalUsers: 320,
  activeUsers: 146,
  newUsers: 28,
  engagedUsers: 211,
  lessonCompletions: 192,
  moduleCompletions: 37,
  tasksCompleted: 58,
  taskCompletionRatePct: 44,
  openTasks: 74,
  activeSubscriptions: 19,
  sales: 6,
  metrics: [],
  trend: [],
  topicStats: [],
  decisionTrees: []
};

const baseFinancials = {
  generatedAt: '2026-03-14T12:00:00.000Z',
  periodLabel: 'Last 30 days',
  monthlyRevenue: 216,
  previousMonthlyRevenue: 180,
  heroTrend: [],
  dailyRevenue: [],
  kpis: []
};

const baseCustomers = [
  {
    id: 'user-1',
    fullName: 'Emma Wilson',
    email: 'emma@stablegrid.io',
    status: 'Active',
    joinedAt: '2026-01-05T09:15:00.000Z',
    orders: 2,
    totalSpent: 24,
    initials: 'EW'
  }
];

const baseBugReports = [
  {
    id: 'bug-1',
    title: 'Cannot open theory module',
    description: 'Theory module crashes when selecting lesson.',
    shortDescription: 'Theory module crashes when selecting lesson.',
    reporterName: 'Emma Wilson',
    reporterEmail: 'emma@stablegrid.io',
    severity: 'High',
    status: 'New',
    statusDb: 'new',
    submittedAt: '2026-03-14T12:00:00.000Z',
    module: 'Theory',
    browser: 'Chrome',
    device: 'Desktop',
    stepsToReproduce: null,
    expectedResult: null,
    actualResult: null,
    attachmentUrls: [],
    pageUrl: '/theory'
  }
];

const baseBoard = {
  todo: [
    {
      id: 'task-1',
      title: 'Complete 1 PySpark module',
      description: 'Continue through the next theory units in this track.',
      status: 'todo' as const,
      taskType: 'theory' as const,
      taskGroup: 'theory' as const,
      trackSlug: 'pyspark',
      trackTitle: 'PySpark',
      scopeType: 'count' as const,
      requestedCount: 1,
      progress: {
        completed: 0,
        total: 1
      },
      primaryContentItemId: 'content-1',
      statusLabel: '1 linked item',
      actionLabel: 'Start' as const,
      createdAt: '2026-03-14T10:00:00.000Z',
      startedAt: null,
      completedAt: null
    }
  ],
  inProgress: [],
  completed: [],
  catalog: {
    tracks: [
      {
        slug: 'pyspark',
        title: 'PySpark'
      }
    ],
    taskOptions: {
      theory: [],
      theoryCompleted: [],
      flashcards: [],
      notebooks: [],
      missions: []
    }
  }
};

describe('admin API routes', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminAccessMock.mockReset();
    createAdminClientMock.mockReset();
    listAdminAnalyticsMock.mockReset();
    listAdminFinancialsMock.mockReset();
    listAdminCustomersMock.mockReset();
    listAdminBugReportsMock.mockReset();
    updateAdminBugReportStatusMock.mockReset();
    listAdminCatalogMock.mockReset();
    upsertAdminContentItemMock.mockReset();
    logAdminAuditMock.mockReset();
    getAdminActivationTaskSnapshotMock.mockReset();
    getActivationBoardDataMock.mockReset();
    startActivationTaskMock.mockReset();
    editActivationTaskMock.mockReset();
  });

  it('GET /api/admin/catalog returns 401 when admin access is missing', async () => {
    const { AdminAccessError } = await import('@/lib/admin/access');
    requireAdminAccessMock.mockRejectedValueOnce(
      new AdminAccessError('Unauthorized', 401)
    );

    const { GET } = await import('@/app/api/admin/catalog/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload).toEqual({ error: 'Unauthorized' });
  });

  it('GET /api/admin/access returns enabled admin access metadata', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);

    const { GET } = await import('@/app/api/admin/access/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data).toEqual({
      enabled: true,
      role: 'super_admin'
    });
  });

  it('GET /api/admin/analytics returns analytics data for an authorized admin', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listAdminAnalyticsMock.mockResolvedValueOnce(baseAnalytics);

    const { GET } = await import('@/app/api/admin/analytics/route');
    const request = new Request('http://localhost:3000/api/admin/analytics?period=weekly');
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminAnalyticsMock).toHaveBeenCalledWith(adminSupabase, {
      period: 'weekly'
    });
    expect(payload.data).toEqual(baseAnalytics);
  });

  it('GET /api/admin/financials returns financial data for an authorized admin', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listAdminFinancialsMock.mockResolvedValueOnce(baseFinancials);

    const { GET } = await import('@/app/api/admin/financials/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminFinancialsMock).toHaveBeenCalledWith(adminSupabase);
    expect(payload.data).toEqual(baseFinancials);
  });

  it('GET /api/admin/customers returns customer data for an authorized admin', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listAdminCustomersMock.mockResolvedValueOnce(baseCustomers);

    const { GET } = await import('@/app/api/admin/customers/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminCustomersMock).toHaveBeenCalledWith(adminSupabase);
    expect(payload.data).toEqual(baseCustomers);
  });

  it('GET /api/admin/bugs returns bug report data for an authorized admin', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listAdminBugReportsMock.mockResolvedValueOnce(baseBugReports);

    const { GET } = await import('@/app/api/admin/bugs/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminBugReportsMock).toHaveBeenCalledWith(adminSupabase);
    expect(payload.data).toEqual(baseBugReports);
  });

  it('PATCH /api/admin/bugs/:id updates bug status and writes audit log', async () => {
    const adminState = createApiProtectionAdminState();
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    updateAdminBugReportStatusMock.mockResolvedValueOnce({
      before: baseBugReports[0],
      after: {
        ...baseBugReports[0],
        status: 'In Review',
        statusDb: 'triaged'
      }
    });

    const { PATCH } = await import('@/app/api/admin/bugs/[id]/route');
    const response = await PATCH(
      new Request('http://localhost:3000/api/admin/bugs/bug-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'triaged'
        })
      }),
      { params: { id: 'bug-1' } }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateAdminBugReportStatusMock).toHaveBeenCalledWith({
      supabase: adminSupabase,
      reportId: 'bug-1',
      status: 'triaged'
    });
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'bug_report',
        entityId: 'bug-1',
        action: 'bug_report_status_updated'
      })
    );
    expect(payload.data.status).toBe('In Review');
  });

  it('GET /api/admin/catalog returns catalog data for an authorized admin', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listAdminCatalogMock.mockResolvedValueOnce(baseCatalog);

    const { GET } = await import('@/app/api/admin/catalog/route');
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(listAdminCatalogMock).toHaveBeenCalledWith(adminSupabase);
    expect(payload.data).toEqual(baseCatalog);
  });

  it('POST /api/admin/content-items writes an audit log after creating an item', async () => {
    const adminState = createApiProtectionAdminState();
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    upsertAdminContentItemMock.mockResolvedValueOnce({
      before: null,
      after: {
        id: 'content-1',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        contentType: 'theory_module',
        sourceRef: 'module-21',
        title: 'Module 21',
        sequenceOrder: 21,
        isActive: true,
        createdAt: '2026-03-14T10:00:00.000Z',
        updatedAt: '2026-03-14T10:00:00.000Z'
      }
    });

    const { POST } = await import('@/app/api/admin/content-items/route');
    const response = await POST(
      new Request('http://localhost/api/admin/content-items', {
        method: 'POST',
        body: JSON.stringify({
          trackId: 'track-1',
          contentType: 'theory_module',
          sourceRef: 'module-21',
          title: 'Module 21',
          sequenceOrder: 21,
          isActive: true
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(upsertAdminContentItemMock).toHaveBeenCalledWith({
      supabase: adminSupabase,
      input: {
        trackId: 'track-1',
        contentType: 'theory_module',
        sourceRef: 'module-21',
        title: 'Module 21',
        sequenceOrder: 21,
        isActive: true
      }
    });
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: adminSupabase,
        actorUserId: 'admin-1',
        entityType: 'content_item',
        action: 'content_item_created'
      })
    );
    expect(payload.data.id).toBe('content-1');
  });

  it('PATCH /api/admin/users/:id/activation-tasks/:taskId starts a task and logs the mutation', async () => {
    const adminState = createApiProtectionAdminState();
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    getAdminActivationTaskSnapshotMock
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        taskType: 'theory',
        taskGroup: 'theory',
        title: 'Complete 1 PySpark module',
        description: 'Continue through the next theory units in this track.',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        scopeType: 'count',
        requestedCount: 1,
        status: 'todo',
        sortOrder: 1000,
        createdAt: '2026-03-14T10:00:00.000Z',
        startedAt: null,
        completedAt: null,
        linkedItems: []
      })
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        taskType: 'theory',
        taskGroup: 'theory',
        title: 'Complete 1 PySpark module',
        description: 'Continue through the next theory units in this track.',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        scopeType: 'count',
        requestedCount: 1,
        status: 'in_progress',
        sortOrder: 1000,
        createdAt: '2026-03-14T10:00:00.000Z',
        startedAt: '2026-03-14T11:00:00.000Z',
        completedAt: null,
        linkedItems: []
      });
    startActivationTaskMock.mockResolvedValueOnce(undefined);
    getActivationBoardDataMock.mockResolvedValueOnce({
      ...baseBoard,
      todo: [],
      inProgress: [
        {
          ...baseBoard.todo[0],
          status: 'in_progress',
          actionLabel: 'Open',
          startedAt: '2026-03-14T11:00:00.000Z'
        }
      ]
    });

    const { PATCH } = await import(
      '@/app/api/admin/users/[id]/activation-tasks/[taskId]/route'
    );
    const response = await PATCH(
      new Request('http://localhost/api/admin/users/user-1/activation-tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'start' })
      }),
      {
        params: {
          id: 'user-1',
          taskId: 'task-1'
        }
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(startActivationTaskMock).toHaveBeenCalledWith({
      supabase: adminSupabase,
      userId: 'user-1',
      taskId: 'task-1'
    });
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        supabase: adminSupabase,
        actorUserId: 'admin-1',
        targetUserId: 'user-1',
        entityType: 'activation_task_status',
        action: 'activation_task_started'
      })
    );
    expect(payload.data.task.id).toBe('task-1');
    expect(payload.data.board.inProgress).toHaveLength(1);
  });

  it('PATCH /api/admin/users/:id/activation-tasks/:taskId forwards custom title and description', async () => {
    const adminState = createApiProtectionAdminState();
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    getAdminActivationTaskSnapshotMock
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        taskType: 'task',
        taskGroup: 'notebooks',
        title: 'Complete 1 PySpark notebook',
        description: 'Apply your learning through guided practical work.',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        scopeType: 'count',
        requestedCount: 1,
        status: 'todo',
        sortOrder: 1000,
        createdAt: '2026-03-14T10:00:00.000Z',
        startedAt: null,
        completedAt: null,
        linkedItems: []
      })
      .mockResolvedValueOnce({
        id: 'task-1',
        userId: 'user-1',
        taskType: 'task',
        taskGroup: 'notebooks',
        title: 'Run the outage notebook',
        description: 'Focus on anomaly detection notes and final checks.',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        scopeType: 'count',
        requestedCount: 1,
        status: 'todo',
        sortOrder: 1000,
        createdAt: '2026-03-14T10:00:00.000Z',
        startedAt: null,
        completedAt: null,
        linkedItems: []
      });
    editActivationTaskMock.mockResolvedValueOnce(undefined);
    getActivationBoardDataMock.mockResolvedValueOnce({
      ...baseBoard,
      todo: [
        {
          ...baseBoard.todo[0],
          taskType: 'task',
          taskGroup: 'notebooks',
          title: 'Run the outage notebook',
          description: 'Focus on anomaly detection notes and final checks.'
        }
      ]
    });

    const { PATCH } = await import(
      '@/app/api/admin/users/[id]/activation-tasks/[taskId]/route'
    );
    const response = await PATCH(
      new Request('http://localhost/api/admin/users/user-1/activation-tasks/task-1', {
        method: 'PATCH',
        body: JSON.stringify({
          taskType: 'task',
          taskGroup: 'notebooks',
          trackSlug: 'pyspark',
          scopeType: 'count',
          requestedCount: 1,
          title: 'Run the outage notebook',
          description: 'Focus on anomaly detection notes and final checks.'
        })
      }),
      {
        params: {
          id: 'user-1',
          taskId: 'task-1'
        }
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(editActivationTaskMock).toHaveBeenCalledWith({
      supabase: adminSupabase,
      userId: 'user-1',
      taskId: 'task-1',
      input: expect.objectContaining({
        title: 'Run the outage notebook',
        description: 'Focus on anomaly detection notes and final checks.'
      })
    });
    expect(payload.data.task.title).toBe('Run the outage notebook');
  });

  it('replays duplicate admin content item creates without double-writing the audit mutation', async () => {
    const adminState = createApiProtectionAdminState();
    createAdminClientMock.mockReturnValue(createApiProtectionAdminClient(adminState));
    requireAdminAccessMock.mockResolvedValue(accessContext);
    upsertAdminContentItemMock.mockResolvedValueOnce({
      before: null,
      after: {
        id: 'content-1',
        trackId: 'track-1',
        trackSlug: 'pyspark',
        trackTitle: 'PySpark',
        contentType: 'theory_module',
        sourceRef: 'module-21',
        title: 'Module 21',
        sequenceOrder: 21,
        isActive: true,
        createdAt: '2026-03-14T10:00:00.000Z',
        updatedAt: '2026-03-14T10:00:00.000Z'
      }
    });

    const { POST } = await import('@/app/api/admin/content-items/route');
    const request = () =>
      new Request('http://localhost/api/admin/content-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'admin-content-create-1234',
          'x-forwarded-for': '203.0.113.21'
        },
        body: JSON.stringify({
          trackId: 'track-1',
          contentType: 'theory_module',
          sourceRef: 'module-21',
          title: 'Module 21',
          sequenceOrder: 21,
          isActive: true
        })
      });

    const firstResponse = await POST(request());
    const secondResponse = await POST(request());

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(await firstResponse.json()).toEqual(await secondResponse.json());
    expect(upsertAdminContentItemMock).toHaveBeenCalledTimes(1);
    expect(logAdminAuditMock).toHaveBeenCalledTimes(1);
  });
});
