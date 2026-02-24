import type { TheoryDoc } from '@/types/theory';

export const fabricTheory: TheoryDoc = {
  topic: 'fabric',
  title: 'Microsoft Fabric Modules',
  description: 'Material reset. New module content will be added in lessons format.',
  version: 'Reset v1',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: Curriculum Reset',
      description: 'Existing Fabric content removed as requested.',
      totalMinutes: 10,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: Placeholder',
          estimatedMinutes: 10,
          blocks: [
            {
              type: 'callout',
              variant: 'info',
              title: 'Content cleared',
              content:
                'Legacy Microsoft Fabric learning material has been removed. Add new modules and lessons to continue.'
            }
          ]
        }
      ]
    }
  ]
};
