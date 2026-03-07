import { describe, expect, it } from 'vitest';
import { theoryDocs } from '@/data/learn/theory';
import type { TheoryDoc } from '@/types/theory';
import {
  formatTheoryValidationErrors,
  validateTheoryDoc,
  validateTheoryDocs
} from '@/lib/validators/theoryContentValidator';

const createValidDoc = (): TheoryDoc => ({
  topic: 'pyspark',
  title: 'PySpark Modules',
  description: 'Module-based learning.',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: Intro',
      description: 'Foundations',
      totalMinutes: 20,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: Intro to Spark',
          estimatedMinutes: 20,
          blocks: [
            {
              type: 'paragraph',
              content: 'Spark is a distributed compute engine.'
            }
          ]
        }
      ],
      checkpointQuiz: {
        question: 'Which statement is true?',
        options: ['Spark runs distributed jobs', 'Spark is only a database'],
        correctAnswer: 'Spark runs distributed jobs',
        explanation: 'Spark coordinates distributed execution across worker nodes.'
      }
    }
  ]
});

describe('theoryContentValidator', () => {
  it('validates shipped theory docs', () => {
    const result = validateTheoryDocs(theoryDocs);
    if (!result.isValid) {
      throw new Error(formatTheoryValidationErrors(result.errors));
    }
    expect(result.errors).toHaveLength(0);
  });

  it('flags duplicated lesson prefix in a lesson title', () => {
    const doc = createValidDoc();
    doc.chapters[0].sections[0].title = 'Lesson 1: Lesson 1: Intro to Spark';

    const result = validateTheoryDoc(doc);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === 'duplicate_lesson_prefix')).toBe(true);
  });

  it('flags module-minute mismatch and invalid markdown links', () => {
    const doc = createValidDoc();
    doc.chapters[0].totalMinutes = 30;
    doc.chapters[0].sections[0].blocks = [
      {
        type: 'paragraph',
        content: 'Read [this guide](ftp://invalid-link).'
      }
    ];

    const result = validateTheoryDoc(doc);
    const codes = result.errors.map((error) => error.code);

    expect(result.isValid).toBe(false);
    expect(codes).toContain('module_minutes_mismatch');
    expect(codes).toContain('invalid_link');
  });

  it('flags oversized lesson titles', () => {
    const doc = createValidDoc();
    doc.chapters[0].sections[0].title =
      'Lesson 1: This title is intentionally long enough to exceed the validator limit and simulate a malformed theory import where lesson body text leaked into the title field.';

    const result = validateTheoryDoc(doc);

    expect(result.isValid).toBe(false);
    expect(result.errors.some((error) => error.code === 'lesson_title_too_long')).toBe(true);
  });

  it('flags duplicate module/lesson titles and fenced code block content', () => {
    const doc = createValidDoc();
    doc.chapters.push({
      id: 'module-02',
      number: 2,
      title: 'Module 1: Intro',
      description: 'Duplicate title module',
      totalMinutes: 20,
      sections: [
        {
          id: 'module-02-lesson-01',
          title: 'Lesson 1: Intro to Spark',
          estimatedMinutes: 20,
          blocks: [
            {
              type: 'code',
              language: 'python',
              content: '```python\nprint("bad fence")\n```'
            }
          ]
        },
        {
          id: 'module-02-lesson-02',
          title: 'Lesson 2: Intro to Spark',
          estimatedMinutes: 20,
          blocks: [
            {
              type: 'paragraph',
              content: 'Duplicate lesson title after prefix stripping.'
            }
          ]
        }
      ]
    });

    const result = validateTheoryDoc(doc);
    const codes = result.errors.map((error) => error.code);

    expect(result.isValid).toBe(false);
    expect(codes).toContain('duplicate_module_title');
    expect(codes).toContain('duplicate_lesson_title');
    expect(codes).toContain('code_block_contains_fence');
  });
});
