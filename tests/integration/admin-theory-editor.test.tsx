import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TheoryLessonsSection } from '@/components/admin/TheoryLessonsSection';
import type { AdminTheoryDocPayload, AdminTheoryTopicSummary } from '@/lib/admin/types';
import type { ContentBlock } from '@/types/theory';

vi.mock('@/components/learn/theory/TheorySection', () => ({
  TheorySection: ({ section }: { section: { title: string } }) => (
    <div data-testid="theory-preview">{section.title}</div>
  )
}));

const buildSummary = (
  topic: string,
  title: string,
  chapterCount: number,
  lessonCount: number
): AdminTheoryTopicSummary => ({
  topic,
  title,
  version: 'DOCX import 2026-03-14',
  chapterCount,
  lessonCount
});

const buildDocPayload = ({
  topic,
  title,
  chapterTitle,
  lessonTitle,
  blocks
}: {
  topic: string;
  title: string;
  chapterTitle: string;
  lessonTitle: string;
  blocks?: ContentBlock[];
}): AdminTheoryDocPayload => ({
  topic,
  summary: buildSummary(topic, title, 1, 1),
  doc: {
    topic,
    title,
    description: 'desc',
    chapters: [
      {
        id: 'module-01',
        number: 1,
        title: chapterTitle,
        description: 'desc',
        totalMinutes: 7,
        sections: [
          {
            id: 'module-01-lesson-01',
            title: lessonTitle,
            estimatedMinutes: 7,
            blocks: blocks ?? [{ type: 'paragraph', content: `${lessonTitle} body` }]
          }
        ]
      }
    ]
  }
});

const createJsonResponse = <T,>(data: T) =>
  Promise.resolve({
    ok: true,
    json: async () => ({ data })
  });

const createDeferredResponse = <T,>() => {
  let resolveResponse: ((value: { ok: boolean; json: () => Promise<{ data: T }> }) => void) | null =
    null;

  return {
    promise: new Promise<{ ok: boolean; json: () => Promise<{ data: T }> }>((resolve) => {
      resolveResponse = resolve;
    }),
    resolve(data: T) {
      resolveResponse?.({
        ok: true,
        json: async () => ({ data })
      });
    }
  };
};

describe('TheoryLessonsSection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shows the exact theory track names in the admin track dropdown', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.endsWith('/api/admin/theory-docs')) {
        return createJsonResponse([
          buildSummary('pyspark', 'PySpark Modules', 20, 256),
          buildSummary(
            'pyspark-data-engineering-track',
            'PySpark: Data Engineering Track',
            10,
            120
          ),
          buildSummary('fabric', 'Microsoft Fabric Modules', 20, 199)
        ]);
      }

      if (url.includes('/api/admin/theory-docs?topic=')) {
        return createJsonResponse(
          buildDocPayload({
            topic: 'pyspark',
            title: 'PySpark Modules',
            chapterTitle: 'Module 1: Foundations',
            lessonTitle: 'Lesson 1: Spark overview'
          })
        );
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<TheoryLessonsSection onMutation={() => {}} />);

    const trackSelect = await screen.findByRole('combobox', { name: 'Track' });
    const optionLabels = Array.from(trackSelect.querySelectorAll('option')).map(
      (option) => option.textContent
    );

    expect(optionLabels).toEqual([
      'PySpark: The Full Stack',
      'PySpark: Data Engineering Track',
      'Fabric: End-to-End Platform'
    ]);
    expect(screen.getAllByText('PySpark: The Full Stack')).toHaveLength(2);
  });

  it('keeps the newly selected track active when a stale theory-doc response resolves late', async () => {
    const summaries = [
      buildSummary('pyspark', 'PySpark Modules', 20, 256),
      buildSummary('pyspark-data-engineering-track', 'PySpark: Data Engineering Track', 10, 120),
      buildSummary('fabric', 'Microsoft Fabric Modules', 20, 199)
    ];
    const pysparkDeferred = createDeferredResponse<AdminTheoryDocPayload>();
    const fabricDeferred = createDeferredResponse<AdminTheoryDocPayload>();
    const fetchMock = vi.mocked(fetch);

    fetchMock.mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.endsWith('/api/admin/theory-docs')) {
        return createJsonResponse(summaries);
      }

      if (url.includes('topic=pyspark')) {
        return pysparkDeferred.promise;
      }

      if (url.includes('topic=fabric')) {
        return fabricDeferred.promise;
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<TheoryLessonsSection onMutation={() => {}} />);

    const saveButton = screen.getByRole('button', { name: 'Save lesson' });
    const trackSelect = await screen.findByRole('combobox', { name: 'Track' });

    expect(saveButton).toBeDisabled();

    fireEvent.change(trackSelect, { target: { value: 'fabric' } });
    expect(saveButton).toBeDisabled();

    fabricDeferred.resolve(
      buildDocPayload({
        topic: 'fabric',
        title: 'Microsoft Fabric Modules',
        chapterTitle: 'Module 1: Platform Foundations & Architecture',
        lessonTitle: 'Lesson 1: Module Overview'
      })
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Track' })).toHaveValue('fabric');
      expect(screen.getByLabelText('Lesson title')).toHaveValue('Lesson 1: Module Overview');
      expect(screen.getByTestId('theory-preview')).toHaveTextContent('Lesson 1: Module Overview');
    });

    pysparkDeferred.resolve(
      buildDocPayload({
        topic: 'pyspark',
        title: 'PySpark Modules',
        chapterTitle: 'Module 1: The Dawn of PySpark',
        lessonTitle: 'Lesson 1: The Catalyst'
      })
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Track' })).toHaveValue('fabric');
      expect(screen.getByLabelText('Lesson title')).toHaveValue('Lesson 1: Module Overview');
      expect(saveButton).toBeEnabled();
    });
  });

  it('reorders lesson blocks from the lesson map and removes manual up/down buttons', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input.url;

      if (url.endsWith('/api/admin/theory-docs')) {
        return createJsonResponse([
          buildSummary('pyspark', 'PySpark Modules', 20, 256),
          buildSummary('fabric', 'Microsoft Fabric Modules', 20, 199)
        ]);
      }

      if (url.includes('/api/admin/theory-docs?topic=')) {
        return createJsonResponse(
          buildDocPayload({
            topic: 'pyspark',
            title: 'PySpark Modules',
            chapterTitle: 'Module 1: Foundations',
            lessonTitle: 'Lesson 1: Spark overview',
            blocks: [
              { type: 'paragraph', content: 'First block copy' },
              { type: 'paragraph', content: 'Second block copy' },
              { type: 'paragraph', content: 'Third block copy' }
            ]
          })
        );
      }

      throw new Error(`Unhandled fetch URL: ${url}`);
    });

    render(<TheoryLessonsSection onMutation={() => {}} />);

    // Wait for lesson map items to appear — the Lesson title label exists even before the
    // doc loads (the input is just disabled), so findByLabelText resolves immediately.
    // findAllByTestId waits until the fetch completes and blocksDraft is populated.
    const mapItems = await screen.findAllByTestId('lesson-map-item');

    expect(screen.queryByRole('button', { name: 'Up' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Down' })).not.toBeInTheDocument();
    expect(mapItems[0]).toHaveTextContent('First block copy');
    expect(mapItems[1]).toHaveTextContent('Second block copy');

    expect(mapItems[0]).toHaveAttribute('draggable', 'true');

    fireEvent.keyDown(mapItems[0], { key: 'ArrowDown', shiftKey: true });

    await waitFor(() => {
      const reorderedItems = screen.getAllByTestId('lesson-map-item');
      expect(reorderedItems[0]).toHaveTextContent('Second block copy');
      expect(reorderedItems[1]).toHaveTextContent('First block copy');
      expect(screen.getByLabelText('Lesson title')).toHaveValue('Lesson 1: Spark overview');
    });
  });
});
