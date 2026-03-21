import { describe, expect, it } from 'vitest';
import { fabricBusinessIntelligenceTrack } from '@/data/learn/theory/fabric-business-intelligence-track';

describe('fabricBusinessIntelligenceTrack', () => {
  it('preserves BI chapter ids while restoring multi-lesson BI modules', () => {
    const semanticModelsChapter = fabricBusinessIntelligenceTrack.chapters[1];
    const daxChapter = fabricBusinessIntelligenceTrack.chapters[2];

    expect(semanticModelsChapter?.id).toBe('module-BI2');
    expect(semanticModelsChapter?.sections.length).toBeGreaterThan(1);
    expect(semanticModelsChapter?.sections[0]?.id).toBe('module-BI2-lesson-01');

    expect(daxChapter?.id).toBe('module-BI3');
    expect(daxChapter?.sections.length).toBeGreaterThan(1);
    expect(daxChapter?.sections[0]?.title).toContain('DAX');
  });
});
