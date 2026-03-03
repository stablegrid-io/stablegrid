import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadingHistoryList } from '@/components/progress/ReadingHistoryList';
import type { ReadingHistoryEntry } from '@/types/progress';

describe('ReadingHistoryList', () => {
  it('renders durable lesson history entries with deep links back into theory', () => {
    const entries: ReadingHistoryEntry[] = [
      {
        id: 'history-1',
        userId: 'user-1',
        topic: 'pyspark',
        chapterId: 'module-01',
        chapterNumber: 1,
        chapterTitle: 'Module 1: The Dawn of PySpark',
        lessonId: 'module-01-lesson-02',
        lessonOrder: 2,
        lessonTitle: 'Lesson 2: SparkSession Basics',
        readAt: '2026-03-03T10:00:00.000Z'
      }
    ];

    render(<ReadingHistoryList entries={entries} />);

    const entryLink = screen.getByRole('link', {
      name: /pyspark · m1 · l2/i
    });

    expect(entryLink).toHaveAttribute(
      'href',
      '/learn/pyspark/theory/all?chapter=module-01&lesson=module-01-lesson-02'
    );
    expect(screen.getByText('Module 1: The Dawn of PySpark')).toBeInTheDocument();
    expect(screen.getByText('Lesson 2: SparkSession Basics')).toBeInTheDocument();
  });
});
