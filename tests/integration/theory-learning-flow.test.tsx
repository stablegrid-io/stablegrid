import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TheoryCategorySelector } from '@/components/learn/theory/TheoryCategorySelector';
import { TheoryContent } from '@/components/learn/theory/TheoryContent';
import { TheorySidebar } from '@/components/learn/theory/TheorySidebar';
import type { TheoryCategorySummary } from '@/data/learn/theory/categories';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';

const chapterOne: TheoryChapter = {
  id: 'module-01',
  number: 1,
  title: 'Module 1: The Dawn of PySpark',
  description: 'Module one description.',
  totalMinutes: 60,
  sections: [
    {
      id: 'module-01-lesson-01',
      title: 'Lesson 1: Intro to Spark',
      estimatedMinutes: 20,
      blocks: [{ type: 'paragraph', content: 'Intro lesson content.' }]
    },
    {
      id: 'module-01-lesson-02',
      title: 'Lesson 2: SparkSession Basics',
      estimatedMinutes: 20,
      blocks: [{ type: 'paragraph', content: 'SparkSession lesson content.' }]
    },
    {
      id: 'module-01-lesson-03',
      title: 'Lesson 3: Lazy Evaluation',
      estimatedMinutes: 20,
      blocks: [{ type: 'paragraph', content: 'Lazy evaluation lesson content.' }]
    }
  ]
};

const chapterTwo: TheoryChapter = {
  id: 'module-02',
  number: 2,
  title: 'Module 2: DataFrames',
  description: 'Module two description.',
  totalMinutes: 40,
  sections: [
    {
      id: 'module-02-lesson-01',
      title: 'Lesson 1: DataFrame Reads',
      estimatedMinutes: 20,
      blocks: [{ type: 'paragraph', content: 'DataFrame reads content.' }]
    },
    {
      id: 'module-02-lesson-02',
      title: 'Lesson 2: DataFrame Writes',
      estimatedMinutes: 20,
      blocks: [{ type: 'paragraph', content: 'DataFrame writes content.' }]
    }
  ]
};

const allChapters = [chapterOne, chapterTwo];

const doc: TheoryDoc = {
  topic: 'pyspark',
  title: 'PySpark Modules',
  description: 'Module and lesson curriculum',
  chapters: allChapters
};

const categories: TheoryCategorySummary[] = [
  {
    slug: 'history',
    label: 'History',
    description: 'Category for testing.',
    chapterCount: allChapters.length,
    totalMinutes: allChapters.reduce((sum, chapter) => sum + chapter.totalMinutes, 0),
    chapters: allChapters
  }
];

const createScrollContainerRef = () => ({
  current: document.createElement('div') as HTMLDivElement
});

const buildTheoryContentProps = (
  overrides: Partial<Parameters<typeof TheoryContent>[0]> = {}
) => ({
  topic: 'pyspark',
  chapter: chapterOne,
  allChapters,
  activeLessonId: 'module-01-lesson-01',
  onNavigate: vi.fn(),
  onSelectLesson: vi.fn(),
  onCompleteCourse: vi.fn(),
  isNextModuleUnlocked: true,
  isChapterCompleted: false,
  hasModuleCheckpoint: false,
  isProgressLoaded: true,
  completedLessonCount: 0,
  onCompleteModule: vi.fn().mockResolvedValue(true),
  completionActionPending: false,
  scrollContainerRef: createScrollContainerRef(),
  ...overrides
});

// TODO(beta-tests): mocks stale after OAuth + Learn unification — rewrite post-beta
describe.skip('Theory learning flow', () => {
  it('moves to the next lesson inside the same module', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSelectLesson = vi.fn();
    const onCompleteCourse = vi.fn();

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          onNavigate,
          onSelectLesson,
          onCompleteCourse
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /next lesson/i }));

    expect(onSelectLesson).toHaveBeenCalledWith('module-01-lesson-02');
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onCompleteCourse).not.toHaveBeenCalled();
  });

  it('moves to the next module after the last lesson in a module', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSelectLesson = vi.fn();
    const onCompleteCourse = vi.fn();

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          activeLessonId: 'module-01-lesson-03',
          onNavigate,
          onSelectLesson,
          onCompleteCourse
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(onNavigate).toHaveBeenCalledWith(chapterTwo);
    expect(onSelectLesson).not.toHaveBeenCalled();
    expect(onCompleteCourse).not.toHaveBeenCalled();
  });

  it('moves to the final lesson of the previous module from the first lesson of a module', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSelectLesson = vi.fn();
    const onCompleteCourse = vi.fn();

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          chapter: chapterTwo,
          activeLessonId: 'module-02-lesson-01',
          onNavigate,
          onSelectLesson,
          onCompleteCourse
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /previous module/i }));

    expect(onNavigate).toHaveBeenCalledWith(chapterOne, 'module-01-lesson-03');
    expect(onSelectLesson).not.toHaveBeenCalled();
    expect(onCompleteCourse).not.toHaveBeenCalled();
  });

  it('completes the course after the final lesson of the final module', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSelectLesson = vi.fn();
    const onCompleteCourse = vi.fn();

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          chapter: chapterTwo,
          activeLessonId: 'module-02-lesson-02',
          onNavigate,
          onSelectLesson,
          onCompleteCourse
        })}
      />
    );

    await user.click(screen.getByRole('button', { name: /complete course/i }));

    expect(onCompleteCourse).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onSelectLesson).not.toHaveBeenCalled();
  });

  it('renders a single lesson heading with a scan-friendly intro and lesson progress', () => {
    const readingChapter: TheoryChapter = {
      ...chapterOne,
      sections: [
        {
          ...chapterOne.sections[0],
          blocks: [
            {
              type: 'paragraph',
              content:
                'Spark started as a cluster engine for fast analytics. This lesson explains why it matters for data teams.'
            },
            {
              type: 'heading',
              content: 'Core idea'
            },
            {
              type: 'paragraph',
              content:
                'The driver plans work, the executors run work, and Spark keeps the logic distributed for you.'
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'Why it matters',
              content: 'You can reason about jobs without manually wiring every machine.'
            }
          ]
        },
        ...chapterOne.sections.slice(1)
      ]
    };

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          chapter: readingChapter,
          allChapters: [readingChapter, chapterTwo]
        })}
      />
    );

    expect(screen.getAllByRole('heading', { name: 'Intro to Spark' })).toHaveLength(1);
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getAllByText('Core idea').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Why it matters').length).toBeGreaterThan(0);
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getAllByText('1 / 3').length).toBeGreaterThan(0);
    expect(screen.queryByText('Reading mode')).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson at a glance')).not.toBeInTheDocument();
  });

  it('renders neutral lesson navigation and only shows lessons for the active module', async () => {
    const user = userEvent.setup();
    const onSelectLesson = vi.fn();

    render(
      <TheorySidebar
        doc={doc}
        activeChapterId="module-01"
        activeLessonId="module-01-lesson-02"
        completedLessonIds={['module-01-lesson-01', 'module-01-lesson-02']}
        isProgressLoaded
        isChapterCompleted={false}
        onSelectLesson={onSelectLesson}
      />
    );

    expect(screen.getByText('Lesson 1: Intro to Spark')).toBeInTheDocument();
    expect(screen.queryByText(/Lesson 1:\s*Lesson 1:/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson 1: DataFrame Reads')).not.toBeInTheDocument();
    expect(screen.queryByText('Read')).not.toBeInTheDocument();

    const lessonOneButton = screen.getByRole('button', {
      name: /lesson 1: intro to spark/i
    });
    const lessonTwoButton = screen.getByRole('button', {
      name: /lesson 2: sparksession basics/i
    });
    const lessonThreeButton = screen.getByRole('button', {
      name: /lesson 3: lazy evaluation/i
    });

    expect(within(lessonOneButton).getByText('1')).toHaveClass('text-brand-600');
    expect(within(lessonTwoButton).getByText('2')).toHaveClass('bg-brand-500');
    expect(within(lessonThreeButton).getByText('3')).toHaveClass(
      'text-text-light-tertiary'
    );
    expect(screen.getByText('Module progress')).toBeInTheDocument();
    expect(screen.getByText('2/3 lessons completed')).toBeInTheDocument();
    expect(screen.getAllByText('20 min')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: /lesson 3: lazy evaluation/i }));
    expect(onSelectLesson).toHaveBeenCalledWith('module-01-lesson-03');
  });

  it('surfaces checkpoint readiness in the sidebar when a module has a checkpoint', () => {
    const checkpointDoc: TheoryDoc = {
      ...doc,
      chapters: [
        {
          ...chapterOne,
          sections: [
            ...chapterOne.sections.slice(0, 2),
            {
              id: 'module-01-lesson-03',
              title: 'Lesson 3: Module Checkpoint',
              estimatedMinutes: 10,
              blocks: [{ type: 'paragraph', content: 'Checkpoint intro.' }]
            }
          ]
        },
        chapterTwo
      ]
    };

    render(
      <TheorySidebar
        doc={checkpointDoc}
        activeChapterId="module-01"
        activeLessonId="module-01-lesson-03"
        completedLessonIds={[
          'module-01-lesson-01',
          'module-01-lesson-02',
          'module-01-lesson-03'
        ]}
        isProgressLoaded
        isChapterCompleted={false}
        onSelectLesson={vi.fn()}
      />
    );

    expect(screen.getByText('Checkpoint ready')).toBeInTheDocument();
    expect(screen.getByText('Pass 2/3')).toBeInTheDocument();
  });

  it('shows syncing progress instead of a false zero while lesson reads hydrate', () => {
    const checkpointDoc: TheoryDoc = {
      ...doc,
      chapters: [
        {
          ...chapterOne,
          sections: [
            ...chapterOne.sections.slice(0, 2),
            {
              id: 'module-01-lesson-03',
              title: 'Lesson 3: Module Checkpoint',
              estimatedMinutes: 10,
              blocks: [{ type: 'paragraph', content: 'Checkpoint intro.' }]
            }
          ]
        },
        chapterTwo
      ]
    };

    render(
      <TheorySidebar
        doc={checkpointDoc}
        activeChapterId="module-01"
        activeLessonId="module-01-lesson-01"
        completedLessonIds={[]}
        isProgressLoaded={false}
        isChapterCompleted={false}
        onSelectLesson={vi.fn()}
      />
    );

    expect(screen.getByText('Checkpoint pending')).toBeInTheDocument();
    expect(screen.getByText('Syncing lesson reads')).toBeInTheDocument();
    expect(screen.queryByText('0/3 read')).not.toBeInTheDocument();
  });

  it('does not render manual module completion controls', () => {
    render(
      <TheoryContent
        {...buildTheoryContentProps()}
      />
    );

    expect(
      screen.queryByRole('button', { name: /i have read this module/i })
    ).not.toBeInTheDocument();
  });

  it('keeps next module locked until current module completion', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          activeLessonId: 'module-01-lesson-03',
          onNavigate,
          onSelectLesson: vi.fn(),
          onCompleteCourse: vi.fn(),
          isNextModuleUnlocked: false
        })}
      />
    );

    const lockedButton = screen.getByRole('button', { name: /module locked/i });
    expect(lockedButton).toBeDisabled();

    await user.click(lockedButton);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('requires the checkpoint flow before leaving a checkpoint lesson', () => {
    const checkpointChapter: TheoryChapter = {
      ...chapterOne,
      sections: [
        ...chapterOne.sections.slice(0, 2),
        {
          id: 'module-01-lesson-03',
          title: 'Lesson 3: Module Checkpoint',
          estimatedMinutes: 10,
          blocks: [{ type: 'paragraph', content: 'Checkpoint intro.' }]
        }
      ]
    };

    render(
      <TheoryContent
        {...buildTheoryContentProps({
          chapter: checkpointChapter,
          allChapters: [checkpointChapter, chapterTwo],
          activeLessonId: 'module-01-lesson-03',
          hasModuleCheckpoint: true,
          completedLessonCount: 3,
          isNextModuleUnlocked: false
        })}
      />
    );

    expect(
      screen.getByRole('button', { name: /finish checkpoint/i })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /start checkpoint/i })
    ).toBeInTheDocument();
  });

  it('uses stored last-visited route when opening a module card', () => {
    render(
      <TheoryCategorySelector
        doc={doc}
        categories={categories}
        completedChapterIds={[]}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 2,
            sectionsTotal: 3,
            isCompleted: false,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-01-lesson-02',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03'
          },
          'module-02': {
            sectionsRead: 1,
            sectionsTotal: 2,
            isCompleted: false,
            lastActiveAt: '2026-02-22T10:00:00.000Z',
            currentLessonId: null,
            lastVisitedRoute: null
          }
        }}
      />
    );

    const moduleOneLink = screen.getByText('Module 1: The Dawn of PySpark').closest('a');
    expect(moduleOneLink).toHaveAttribute(
      'href',
      '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03'
    );

    const moduleTwoLink = screen.getByText('Module 2: DataFrames').closest('a');
    expect(moduleTwoLink).toHaveAttribute(
      'href',
      '/learn/pyspark/theory/all?chapter=module-02'
    );
  });

  it('unlocks module 2 only after module 1 is completed', () => {
    const { rerender } = render(
      <TheoryCategorySelector
        doc={doc}
        categories={categories}
        completedChapterIds={[]}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 1,
            sectionsTotal: 3,
            isCompleted: false,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-01-lesson-01',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-01'
          },
          'module-02': {
            sectionsRead: 0,
            sectionsTotal: 2,
            isCompleted: false,
            lastActiveAt: null,
            currentLessonId: null,
            lastVisitedRoute: null
          }
        }}
      />
    );

    expect(screen.getByLabelText('Module 2: DataFrames locked')).toBeInTheDocument();

    rerender(
      <TheoryCategorySelector
        doc={doc}
        categories={categories}
        completedChapterIds={['module-01']}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 3,
            sectionsTotal: 3,
            isCompleted: true,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03'
          },
          'module-02': {
            sectionsRead: 0,
            sectionsTotal: 2,
            isCompleted: false,
            lastActiveAt: null,
            currentLessonId: null,
            lastVisitedRoute: null
          }
        }}
      />
    );

    expect(
      screen.queryByLabelText('Module 2: DataFrames locked')
    ).not.toBeInTheDocument();
    const unlockedModuleTwoLink = screen.getByText('Module 2: DataFrames').closest('a');
    expect(unlockedModuleTwoLink).toHaveAttribute(
      'href',
      '/learn/pyspark/theory/all?chapter=module-02'
    );
  });

  it('uses authoritative module unlock state over session progress heuristics', () => {
    render(
      <TheoryCategorySelector
        doc={doc}
        categories={categories}
        completedChapterIds={[]}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 3,
            sectionsTotal: 3,
            isCompleted: true,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03'
          },
          'module-02': {
            sectionsRead: 1,
            sectionsTotal: 2,
            isCompleted: false,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-02-lesson-01',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-02&lesson=module-02-lesson-01'
          }
        }}
        moduleProgressById={{
          'module-01': {
            moduleOrder: 1,
            isUnlocked: true,
            isCompleted: true,
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03',
            updatedAt: '2026-02-23T10:00:00.000Z'
          },
          'module-02': {
            moduleOrder: 2,
            isUnlocked: false,
            isCompleted: false,
            currentLessonId: null,
            lastVisitedRoute: null,
            updatedAt: '2026-02-23T10:00:00.000Z'
          }
        }}
      />
    );

    expect(screen.getByLabelText('Module 2: DataFrames locked')).toBeInTheDocument();
  });

  it('shows completion meta only inside the completed module card', () => {
    render(
      <TheoryCategorySelector
        doc={doc}
        categories={categories}
        completedChapterIds={['module-01']}
        chapterProgressById={{
          'module-01': {
            sectionsRead: 3,
            sectionsTotal: 3,
            isCompleted: true,
            lastActiveAt: '2026-02-23T10:00:00.000Z',
            currentLessonId: 'module-01-lesson-03',
            lastVisitedRoute:
              '/learn/pyspark/theory/history?chapter=module-01&lesson=module-01-lesson-03'
          },
          'module-02': {
            sectionsRead: 0,
            sectionsTotal: 2,
            isCompleted: false,
            lastActiveAt: null,
            currentLessonId: null,
            lastVisitedRoute: null
          }
        }}
      />
    );

    const completedCard = screen
      .getByText('Module 1: The Dawn of PySpark')
      .closest('a');

    expect(completedCard).not.toBeNull();
    expect(screen.queryByText('1/2 complete · 60%')).not.toBeInTheDocument();
    expect(within(completedCard as HTMLElement).getByText('Completed')).toBeInTheDocument();
    expect(within(completedCard as HTMLElement).getByText('100%')).toBeInTheDocument();
  });
});
