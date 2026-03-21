import { describe, expect, it } from 'vitest';
import { fabricDataEngineeringTrack } from '@/data/learn/theory/fabric-data-engineering-track';

describe('fabricDataEngineeringTrack', () => {
  it('keeps Track 02 chapter ids while preserving the full lesson breakdown', () => {
    const firstChapter = fabricDataEngineeringTrack.chapters[0];

    expect(firstChapter?.id).toBe('module-F1');
    expect(firstChapter?.sections.length).toBeGreaterThan(1);
    expect(firstChapter?.sections[0]?.id).toBe('module-F1-lesson-01');
    expect(firstChapter?.sections.at(-1)?.id).toBe('module-F1-lesson-10');
    expect(firstChapter?.sections[0]?.title).toBe('Lesson 1: Module Overview');
  });
});
