import type { TheoryDoc } from '@/types/theory';
import pysparkMidTheoryJson from '@/data/learn/theory/published/pyspark-mid.json';
import { freezeTheoryDoc } from '@/lib/learn/freezeTheoryDoc';

const rawDoc = pysparkMidTheoryJson as TheoryDoc;

export const pysparkMidTheory = freezeTheoryDoc({ ...rawDoc, id: 'pyspark-mid' });
