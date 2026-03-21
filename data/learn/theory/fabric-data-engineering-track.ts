import { fabricTheory } from '@/data/learn/theory/fabric';
import type { TheoryChapter, TheoryDoc } from '@/types/theory';

interface FabricTrackChapterMap {
  sourceChapterId: string;
  targetChapterId: string;
  targetTitle: string;
  targetDescription: string;
}

const FABRIC_DATA_ENGINEERING_TRACK_CHAPTERS: FabricTrackChapterMap[] = [
  {
    sourceChapterId: 'module-01',
    targetChapterId: 'module-F1',
    targetTitle: 'Platform Foundations & Architecture',
    targetDescription: 'Module covering platform foundations & architecture'
  },
  {
    sourceChapterId: 'module-02',
    targetChapterId: 'module-F2',
    targetTitle: 'OneLake Storage Foundation',
    targetDescription: 'Module covering OneLake storage foundation'
  },
  {
    sourceChapterId: 'module-03',
    targetChapterId: 'module-DW1',
    targetTitle: 'Lakehouse with SQL Focus',
    targetDescription: 'Module covering lakehouse architecture and SQL endpoints'
  },
  {
    sourceChapterId: 'module-09',
    targetChapterId: 'module-DW2',
    targetTitle: 'Data Warehouse',
    targetDescription: 'Module covering Fabric data warehouse fundamentals'
  },
  {
    sourceChapterId: 'module-10',
    targetChapterId: 'module-DW3',
    targetTitle: 'T-SQL Analytics',
    targetDescription: 'Module covering T-SQL analytics patterns in Fabric'
  },
  {
    sourceChapterId: 'module-11',
    targetChapterId: 'module-DW4',
    targetTitle: 'SQL Database',
    targetDescription: 'Module covering SQL Database in Fabric'
  },
  {
    sourceChapterId: 'module-17',
    targetChapterId: 'module-DW5',
    targetTitle: 'Medallion Architecture',
    targetDescription: 'Module covering medallion architecture and modeling'
  },
  {
    sourceChapterId: 'module-04',
    targetChapterId: 'module-DW6',
    targetTitle: 'Pipelines with SQL',
    targetDescription: 'Module covering data pipelines and orchestration with SQL-focused workflows'
  }
];

const cloneChapterWithTrackIds = (
  sourceChapter: TheoryChapter,
  chapterMap: FabricTrackChapterMap
): TheoryChapter => ({
  ...sourceChapter,
  id: chapterMap.targetChapterId,
  title: chapterMap.targetTitle,
  description: chapterMap.targetDescription,
  sections: sourceChapter.sections.map((section, index) => ({
    ...section,
    id: `${chapterMap.targetChapterId}-lesson-${String(index + 1).padStart(2, '0')}`
  }))
});

const chapters = FABRIC_DATA_ENGINEERING_TRACK_CHAPTERS.map((chapterMap, index) => {
  const sourceChapter = fabricTheory.chapters.find(
    (chapter) => chapter.id === chapterMap.sourceChapterId
  );

  if (!sourceChapter) {
    throw new Error(`Missing Fabric source chapter for ${chapterMap.sourceChapterId}.`);
  }

  return {
    ...cloneChapterWithTrackIds(sourceChapter, chapterMap),
    number: index + 1
  };
});

export const fabricDataEngineeringTrack: TheoryDoc = {
  topic: 'fabric',
  title: 'Microsoft Fabric: Data Engineering Track',
  description:
    'A comprehensive data engineering learning path covering Microsoft Fabric platform foundations, OneLake storage, lakehouse architecture, data warehousing, T-SQL analytics, and ETL pipelines.',
  version:
    typeof fabricTheory.version === 'string'
      ? `${fabricTheory.version} · Fabric data engineering track`
      : 'Fabric data engineering track',
  chapters
};
