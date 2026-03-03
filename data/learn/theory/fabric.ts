import type { TheoryDoc } from '@/types/theory';

export const fabricTheory: TheoryDoc = {
  topic: 'fabric',
  title: 'Microsoft Fabric Modules',
  description:
    'A compact placeholder path that explains the current Fabric learning status and where to continue practicing in StableGrid.',
  version: 'Preview v1',
  chapters: [
    {
      id: 'module-01',
      number: 1,
      title: 'Module 1: Fabric Learning Status',
      description:
        'Understand the current scope of Microsoft Fabric inside StableGrid and the fastest alternatives while the full theory path is rebuilt.',
      totalMinutes: 6,
      sections: [
        {
          id: 'module-01-lesson-01',
          title: 'Lesson 1: Where Fabric Content Stands',
          estimatedMinutes: 6,
          blocks: [
            {
              type: 'paragraph',
              content:
                'The original Microsoft Fabric theory curriculum has been retired, so this topic currently ships as a lightweight placeholder instead of a full multi-module course.'
            },
            {
              type: 'callout',
              variant: 'info',
              title: 'What to do instead',
              content:
                'Use the PySpark theory path for structured reading, and use Fabric practice or missions when they are available for hands-on reinforcement.'
            },
            {
              type: 'bullet-list',
              items: [
                'Expect the Fabric theory catalog to be rebuilt before deeper chapter-by-chapter study returns.',
                'Progress, routing, and category pages remain active so the topic can evolve without another migration.',
                'This placeholder keeps the learning surface internally consistent until the new curriculum lands.'
              ]
            }
          ]
        }
      ]
    }
  ]
};
