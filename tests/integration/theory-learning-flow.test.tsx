import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('Theory learning flow', () => {
  it('moves to the next lesson inside the same module', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const onSelectLesson = vi.fn();
    const onCompleteCourse = vi.fn();

    render(
      <TheoryContent
        chapter={chapterOne}
        allChapters={allChapters}
        activeLessonId="module-01-lesson-01"
        onNavigate={onNavigate}
        onSelectLesson={onSelectLesson}
        onCompleteCourse={onCompleteCourse}
        isCompleted={false}
        isNextModuleUnlocked
        onCompletionAction={vi.fn()}
        completionActionPending={false}
        completionRewardLabel="0.15 kWh"
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
        chapter={chapterOne}
        allChapters={allChapters}
        activeLessonId="module-01-lesson-03"
        onNavigate={onNavigate}
        onSelectLesson={onSelectLesson}
        onCompleteCourse={onCompleteCourse}
        isCompleted={false}
        isNextModuleUnlocked
        onCompletionAction={vi.fn()}
        completionActionPending={false}
        completionRewardLabel="0.15 kWh"
      />
    );

    await user.click(screen.getByRole('button', { name: /next module/i }));

    expect(onNavigate).toHaveBeenCalledWith(chapterTwo);
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
        chapter={chapterTwo}
        allChapters={allChapters}
        activeLessonId="module-02-lesson-02"
        onNavigate={onNavigate}
        onSelectLesson={onSelectLesson}
        onCompleteCourse={onCompleteCourse}
        isCompleted={false}
        isNextModuleUnlocked
        onCompletionAction={vi.fn()}
        completionActionPending={false}
        completionRewardLabel="0.15 kWh"
      />
    );

    await user.click(screen.getByRole('button', { name: /complete course/i }));

    expect(onCompleteCourse).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(onSelectLesson).not.toHaveBeenCalled();
  });

  it('renders a single lesson prefix and only shows lessons for the active module', async () => {
    const user = userEvent.setup();
    const onSelectLesson = vi.fn();

    render(
      <TheorySidebar
        doc={doc}
        activeChapterId="module-01"
        activeLessonId="module-01-lesson-02"
        onSelectLesson={onSelectLesson}
      />
    );

    expect(screen.getByText('Lesson 1: Intro to Spark')).toBeInTheDocument();
    expect(screen.queryByText(/Lesson 1:\s*Lesson 1:/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Lesson 1: DataFrame Reads')).not.toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(screen.getAllByText('20 min')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: /lesson 3: lazy evaluation/i }));
    expect(onSelectLesson).toHaveBeenCalledWith('module-01-lesson-03');
  });

  it('calls completion action from module completion card', async () => {
    const user = userEvent.setup();
    const onCompletionAction = vi.fn();

    render(
      <TheoryContent
        chapter={chapterOne}
        allChapters={allChapters}
        activeLessonId="module-01-lesson-01"
        onNavigate={vi.fn()}
        onSelectLesson={vi.fn()}
        onCompleteCourse={vi.fn()}
        isCompleted={false}
        isNextModuleUnlocked
        onCompletionAction={onCompletionAction}
        completionActionPending={false}
        completionRewardLabel="0.15 kWh"
      />
    );

    await user.click(screen.getByRole('button', { name: /i have read this module/i }));
    expect(onCompletionAction).toHaveBeenCalledTimes(1);
  });

  it('keeps next module locked until current module completion', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    render(
      <TheoryContent
        chapter={chapterOne}
        allChapters={allChapters}
        activeLessonId="module-01-lesson-03"
        onNavigate={onNavigate}
        onSelectLesson={vi.fn()}
        onCompleteCourse={vi.fn()}
        isCompleted={false}
        isNextModuleUnlocked={false}
        onCompletionAction={vi.fn()}
        completionActionPending={false}
        completionRewardLabel="0.15 kWh"
      />
    );

    const lockedButton = screen.getByRole('button', { name: /module locked/i });
    expect(lockedButton).toBeDisabled();
    expect(
      screen.getAllByText(/complete this module to unlock/i).length
    ).toBeGreaterThan(0);

    await user.click(lockedButton);
    expect(onNavigate).not.toHaveBeenCalled();
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
});
