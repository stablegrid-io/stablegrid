import type { FrozenTheoryDoc } from '@/types/theory';
import { airflowTheory } from '@/data/learn/theory/airflow';
import { airflowIntermediateTrack } from '@/data/learn/theory/airflow-intermediate-track';
import { airflowSeniorTrack } from '@/data/learn/theory/airflow-senior-track';
import { fabricTheory } from '@/data/learn/theory/fabric';
import { fabricBusinessIntelligenceTrack } from '@/data/learn/theory/fabric-business-intelligence-track';
import { fabricDataEngineeringTrack } from '@/data/learn/theory/fabric-data-engineering-track';
import { pysparkTheory } from '@/data/learn/theory/pyspark';
import { pysparkDataEngineeringTrackTheory } from '@/data/learn/theory/pysparkDataEngineeringTrack';
import { freezeTheoryDoc } from '@/lib/learn/freezeTheoryDoc';

const rawTheoryDocs = {
  pyspark: pysparkTheory,
  'pyspark-data-engineering-track': pysparkDataEngineeringTrackTheory,
  fabric: fabricTheory,
  'fabric-data-engineering-track': fabricDataEngineeringTrack,
  'fabric-business-intelligence-track': fabricBusinessIntelligenceTrack,
  airflow: airflowTheory,
  'airflow-intermediate-track': airflowIntermediateTrack,
  'airflow-senior-track': airflowSeniorTrack
};

export const theoryDocs: Record<string, FrozenTheoryDoc> = Object.entries(
  rawTheoryDocs
).reduce<Record<string, FrozenTheoryDoc>>((accumulator, [key, doc]) => {
  accumulator[key] = freezeTheoryDoc({ ...doc, id: key });
  return accumulator;
}, {});

export const getTheoryMeta = (topic: string) => {
  const doc = theoryDocs[topic];
  if (!doc) return null;
  const chapterCount = doc.chapters.length;
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );
  return { chapterCount, totalMinutes, version: doc.version };
};
