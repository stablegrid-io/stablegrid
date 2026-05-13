import type { TheoryDoc } from '@/types/theory';
import pysparkSeniorTheoryJson from '@/data/learn/theory/published/pyspark-senior.json';
import { freezeTheoryDoc } from '@/lib/learn/freezeTheoryDoc';

const rawDoc = pysparkSeniorTheoryJson as TheoryDoc;

export const pysparkSeniorTheory = freezeTheoryDoc({ ...rawDoc, id: 'pyspark-senior' });
