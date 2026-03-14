import { beforeEach, describe, expect, it, vi } from 'vitest';

const requireAdminAccessMock = vi.fn();
const getTheoryDocForAdminMock = vi.fn();
const listTheoryDocSummariesMock = vi.fn();
const updateTheoryLessonInPublishedDocMock = vi.fn();
const logAdminAuditMock = vi.fn();

vi.mock('@/lib/admin/access', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/access')>(
    '@/lib/admin/access'
  );

  return {
    ...actual,
    requireAdminAccess: requireAdminAccessMock
  };
});

vi.mock('@/lib/admin/theory', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/theory')>(
    '@/lib/admin/theory'
  );

  return {
    ...actual,
    getTheoryDocForAdmin: getTheoryDocForAdminMock,
    listTheoryDocSummaries: listTheoryDocSummariesMock,
    updateTheoryLessonInPublishedDoc: updateTheoryLessonInPublishedDocMock
  };
});

vi.mock('@/lib/admin/service', async () => {
  const actual = await vi.importActual<typeof import('@/lib/admin/service')>(
    '@/lib/admin/service'
  );

  return {
    ...actual,
    logAdminAudit: logAdminAuditMock
  };
});

const accessContext = {
  adminSupabase: {},
  sessionSupabase: {},
  role: 'super_admin' as const,
  user: {
    id: 'admin-1',
    email: 'admin@stablegrid.io'
  }
};

describe('admin theory routes', () => {
  beforeEach(() => {
    vi.resetModules();
    requireAdminAccessMock.mockReset();
    getTheoryDocForAdminMock.mockReset();
    listTheoryDocSummariesMock.mockReset();
    updateTheoryLessonInPublishedDocMock.mockReset();
    logAdminAuditMock.mockReset();
  });

  it('GET /api/admin/theory-docs returns a topic doc payload', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    getTheoryDocForAdminMock.mockResolvedValueOnce({
      topic: 'pyspark',
      summary: {
        topic: 'pyspark',
        title: 'PySpark Modules',
        version: 'DOCX import 2026-03-01',
        chapterCount: 20,
        lessonCount: 60
      },
      doc: {
        topic: 'pyspark',
        title: 'PySpark Modules',
        description: 'desc',
        chapters: []
      }
    });

    const { GET } = await import('@/app/api/admin/theory-docs/route');
    const response = await GET(new Request('http://localhost/api/admin/theory-docs?topic=pyspark'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(requireAdminAccessMock).toHaveBeenCalledWith('content_admin');
    expect(getTheoryDocForAdminMock).toHaveBeenCalledWith('pyspark');
    expect(payload.data.topic).toBe('pyspark');
  });

  it('GET /api/admin/theory-docs returns all available theory track summaries', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    listTheoryDocSummariesMock.mockResolvedValueOnce([
      {
        topic: 'pyspark',
        title: 'PySpark Modules',
        version: 'DOCX import 2026-03-01',
        chapterCount: 20,
        lessonCount: 60
      },
      {
        topic: 'pyspark-data-engineering-track',
        title: 'PySpark: Data Engineering Track',
        version: 'DOCX import 2026-03-14',
        chapterCount: 10,
        lessonCount: 30
      },
      {
        topic: 'fabric',
        title: 'Microsoft Fabric Modules',
        version: 'DOCX import 2026-03-01',
        chapterCount: 20,
        lessonCount: 60
      }
    ]);

    const { GET } = await import('@/app/api/admin/theory-docs/route');
    const response = await GET(new Request('http://localhost/api/admin/theory-docs'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(requireAdminAccessMock).toHaveBeenCalledWith('content_admin');
    expect(listTheoryDocSummariesMock).toHaveBeenCalledTimes(1);
    expect(payload.data).toHaveLength(3);
    expect(payload.data[1].topic).toBe('pyspark-data-engineering-track');
  });

  it('PATCH /api/admin/theory-docs/lessons saves a lesson and writes an audit row', async () => {
    requireAdminAccessMock.mockResolvedValueOnce(accessContext);
    updateTheoryLessonInPublishedDocMock.mockResolvedValueOnce({
      before: {
        title: 'Lesson 1: Old title',
        estimatedMinutes: 7,
        blocks: [{ type: 'paragraph', content: 'Old copy.' }]
      },
      after: {
        topic: 'pyspark',
        chapterId: 'module-01',
        doc: {
          topic: 'pyspark',
          title: 'PySpark Modules',
          description: 'desc',
          chapters: []
        },
        lesson: {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: New title',
          estimatedMinutes: 8,
          blocks: [{ type: 'paragraph', content: 'New copy.' }]
        }
      }
    });

    const { PATCH } = await import('@/app/api/admin/theory-docs/lessons/route');
    const response = await PATCH(
      new Request('http://localhost/api/admin/theory-docs/lessons', {
        method: 'PATCH',
        body: JSON.stringify({
          topic: 'pyspark',
          chapterId: 'module-01',
          lessonId: 'module-01-lesson-01',
          title: 'Lesson 1: New title',
          estimatedMinutes: 8,
          blocks: [{ type: 'paragraph', content: 'New copy.' }]
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(updateTheoryLessonInPublishedDocMock).toHaveBeenCalledWith({
      topic: 'pyspark',
      chapterId: 'module-01',
      lessonId: 'module-01-lesson-01',
      title: 'Lesson 1: New title',
      estimatedMinutes: 8,
      blocks: [{ type: 'paragraph', content: 'New copy.' }]
    });
    expect(logAdminAuditMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        entityType: 'theory_lesson',
        action: 'theory_lesson_updated'
      })
    );
    expect(payload.data.lesson.title).toBe('Lesson 1: New title');
  });
});
