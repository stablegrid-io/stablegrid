import { describe, expect, it } from 'vitest';
import { theoryDocs } from '@/data/learn/theory';
import { freezeTheoryDoc, getDisplayLessonTitle } from '@/lib/learn/freezeTheoryDoc';
import type { TheoryDoc } from '@/types/theory';

describe('frozen course data model', () => {
  it('exposes canonical course -> module -> lesson fields', () => {
    Object.values(theoryDocs).forEach((course) => {
      expect(course.id).toBeTruthy();
      expect(course.slug).toBeTruthy();
      expect(course.status).toBeTruthy();
      expect(course.modules.length).toBe(course.chapters.length);
      expect(course.modules.length).toBeGreaterThan(0);

      const moduleIds = new Set<string>();
      const moduleSlugs = new Set<string>();
      let previousModuleOrder = 0;

      course.modules.forEach((module) => {
        expect(module.id).toBeTruthy();
        expect(module.slug).toBeTruthy();
        expect(module.order).toBeGreaterThan(0);
        expect(module.order).toBeGreaterThan(previousModuleOrder);
        expect(module.number).toBe(module.order);
        expect(module.durationMinutes).toBeGreaterThan(0);
        expect(module.totalMinutes).toBe(module.durationMinutes);
        expect(module.status).toBeTruthy();
        expect(module.learningStatus).toBeTruthy();

        expect(moduleIds.has(module.id)).toBe(false);
        expect(moduleSlugs.has(module.slug)).toBe(false);
        moduleIds.add(module.id);
        moduleSlugs.add(module.slug);
        previousModuleOrder = module.order;

        const lessonIds = new Set<string>();
        const lessonSlugs = new Set<string>();
        let previousLessonOrder = 0;

        module.sections.forEach((lesson) => {
          expect(lesson.id).toBeTruthy();
          expect(lesson.slug).toBeTruthy();
          expect(lesson.order).toBeGreaterThan(0);
          expect(lesson.order).toBeGreaterThan(previousLessonOrder);
          expect(lesson.durationMinutes).toBeGreaterThan(0);
          expect(lesson.estimatedMinutes).toBe(lesson.durationMinutes);
          expect(lesson.status).toBeTruthy();
          expect(lesson.learningStatus).toBeTruthy();

          expect(lessonIds.has(lesson.id)).toBe(false);
          expect(lessonSlugs.has(lesson.slug)).toBe(false);
          lessonIds.add(lesson.id);
          lessonSlugs.add(lesson.slug);
          previousLessonOrder = lesson.order;
        });
      });
    });
  });

  it('freezes legacy docs by deriving missing fields', () => {
    const legacyDoc: TheoryDoc = {
      topic: 'sample',
      title: 'Sample Course',
      description: 'Sample description',
      chapters: [
        {
          id: 'module-raw',
          number: 1,
          title: 'Module 1: Basics',
          description: 'Basics module',
          totalMinutes: 0,
          sections: [
            {
              id: 'module-raw-lesson-a',
              title: 'Lesson 1: Intro',
              estimatedMinutes: 0,
              blocks: [{ type: 'paragraph', content: 'hello' }]
            },
            {
              id: 'module-raw-lesson-b',
              title: 'Working with DataFrames',
              estimatedMinutes: 18,
              blocks: [{ type: 'paragraph', content: 'world' }]
            }
          ]
        }
      ]
    };

    const frozen = freezeTheoryDoc(legacyDoc);

    expect(frozen.id).toBe('sample');
    expect(frozen.slug).toBe('sample');
    expect(frozen.modules[0].order).toBe(1);
    expect(frozen.modules[0].durationMinutes).toBe(19);
    expect(frozen.modules[0].sections[0].durationMinutes).toBe(1);
    expect(frozen.modules[0].sections[1].durationMinutes).toBe(18);
    expect(frozen.modules[0].sections[1].title).toBe('Working with DataFrames');
    expect(frozen.modules[0].sections[1].order).toBe(2);
  });

  it('formats lesson labels without duplicate prefixes', () => {
    expect(
      getDisplayLessonTitle({ title: 'Lesson 1: Intro to Spark', order: 1 }, 1)
    ).toBe('Lesson 1: Intro to Spark');
    expect(
      getDisplayLessonTitle({ title: 'Intro to Spark', order: 1 }, 1)
    ).toBe('Lesson 1: Intro to Spark');
  });

  it('repairs malformed lesson titles that include body text', () => {
    const malformedDoc: TheoryDoc = {
      topic: 'fabric',
      title: 'Fabric Modules',
      description: 'Malformed import sample',
      chapters: [
        {
          id: 'module-01',
          number: 1,
          title: 'Module 1: OneLake',
          description: 'OneLake',
          totalMinutes: 10,
          sections: [
            {
              id: 'module-01-lesson-02',
              title:
                'Lesson 2: OneLake Architecture Deep Dive OneLake is Fabric storage.',
              estimatedMinutes: 10,
              blocks: [
                {
                  type: 'paragraph',
                  content: 'It is provisioned automatically.'
                }
              ]
            }
          ]
        }
      ]
    };

    const frozen = freezeTheoryDoc(malformedDoc);
    const lesson = frozen.modules[0].sections[0];

    expect(lesson.title).toBe('Lesson 2: OneLake Architecture Deep Dive');
    expect(lesson.blocks[0]).toMatchObject({
      type: 'paragraph',
      content:
        'OneLake is Fabric storage. It is provisioned automatically.'
    });
    expect(getDisplayLessonTitle(lesson, 2)).toBe(
      'Lesson 2: OneLake Architecture Deep Dive'
    );
  });
});
