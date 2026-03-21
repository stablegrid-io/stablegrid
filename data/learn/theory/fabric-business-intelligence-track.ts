import { fabricTheory } from '@/data/learn/theory/fabric';
import type { TheoryChapter, TheoryDoc, TheorySection } from '@/types/theory';

interface FabricTrackSectionSource {
  sourceChapterId: string;
  lessonIndexes?: number[];
}

interface FabricBusinessIntelligenceTrackChapterMap {
  targetChapterId: string;
  targetTitle: string;
  targetDescription: string;
  sources: FabricTrackSectionSource[];
}

const FABRIC_BUSINESS_INTELLIGENCE_TRACK_CHAPTERS: FabricBusinessIntelligenceTrackChapterMap[] = [
  {
    targetChapterId: 'module-BI1',
    targetTitle: 'Lakehouse & Warehouse for BI',
    targetDescription:
      'Understanding the data layer and how Gold-layer star schemas are structured for BI reporting',
    sources: [{ sourceChapterId: 'module-03' }]
  },
  {
    targetChapterId: 'module-BI2',
    targetTitle: 'Semantic Models & DirectLake',
    targetDescription:
      'Building the analytical engine for energy reporting with semantic models and DirectLake',
    sources: [{ sourceChapterId: 'module-14', lessonIndexes: [0, 1, 2] }]
  },
  {
    targetChapterId: 'module-BI3',
    targetTitle: 'DAX Deep Dive',
    targetDescription:
      'Think in filters, not in rows, with DAX patterns for production BI analytics',
    sources: [{ sourceChapterId: 'module-14', lessonIndexes: [3, 4, 5, 6, 7, 8, 9] }]
  },
  {
    targetChapterId: 'module-BI4',
    targetTitle: 'Reports & Dashboards',
    targetDescription:
      'Turning DAX measures into decisions with report design, interactivity, and dashboards',
    sources: [{ sourceChapterId: 'module-15', lessonIndexes: [0, 1, 2, 3, 4] }]
  },
  {
    targetChapterId: 'module-BI5',
    targetTitle: 'Distribution & Apps',
    targetDescription:
      'Getting reports to the right people at the right time through sharing, apps, and embedding',
    sources: [{ sourceChapterId: 'module-15', lessonIndexes: [5, 6] }]
  },
  {
    targetChapterId: 'module-BI6',
    targetTitle: 'Row-Level Security & Governance',
    targetDescription:
      'Secure and govern BI experiences with row-level security, auditability, and Purview',
    sources: [{ sourceChapterId: 'module-18' }]
  },
  {
    targetChapterId: 'module-BI7',
    targetTitle: 'Capstone Project',
    targetDescription:
      'Build a complete enterprise BI solution that unifies modeling, DAX, reporting, and governance',
    sources: [{ sourceChapterId: 'module-20' }]
  }
];

const renumberSectionTitle = (title: string, lessonOrder: number) => {
  const normalizedTitle = title.trim();
  const strippedTitle = normalizedTitle.replace(/^lesson\s*\d+\s*:\s*/i, '').trim();

  if (!/^lesson\s*\d+\s*:/i.test(normalizedTitle)) {
    return normalizedTitle;
  }

  return `Lesson ${lessonOrder}: ${strippedTitle}`;
};

const buildTrackSections = (
  sources: FabricTrackSectionSource[],
  targetChapterId: string
): TheorySection[] => {
  const sections = sources.flatMap((source) => {
    const sourceChapter = fabricTheory.chapters.find((chapter) => chapter.id === source.sourceChapterId);

    if (!sourceChapter) {
      throw new Error(`Missing Fabric source chapter for ${source.sourceChapterId}.`);
    }

    const selectedSections =
      source.lessonIndexes?.map((lessonIndex) => sourceChapter.sections[lessonIndex]).filter(Boolean) ??
      sourceChapter.sections;

    return selectedSections.map((section) => ({ ...section }));
  });

  return sections.map((section, index) => ({
    ...section,
    id: `${targetChapterId}-lesson-${String(index + 1).padStart(2, '0')}`,
    title: renumberSectionTitle(section.title, index + 1)
  }));
};

const chapters: TheoryChapter[] = FABRIC_BUSINESS_INTELLIGENCE_TRACK_CHAPTERS.map(
  (chapterMap, index) => {
    const sections = buildTrackSections(chapterMap.sources, chapterMap.targetChapterId);

    return {
      id: chapterMap.targetChapterId,
      number: index + 1,
      title: chapterMap.targetTitle,
      description: chapterMap.targetDescription,
      totalMinutes: sections.reduce((sum, section) => sum + section.estimatedMinutes, 0),
      sections
    };
  }
);

export const fabricBusinessIntelligenceTrack: TheoryDoc = {
  topic: 'fabric',
  title: 'Microsoft Fabric: Business Intelligence Track',
  description:
    'A comprehensive 7-module track on Business Intelligence with Microsoft Fabric, covering data layers, semantic models, DAX, reporting, distribution, governance, and a capstone project.',
  version:
    typeof fabricTheory.version === 'string'
      ? `${fabricTheory.version} · Fabric business intelligence track`
      : 'Fabric business intelligence track',
  chapters
};
