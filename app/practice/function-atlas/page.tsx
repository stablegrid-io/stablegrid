import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';

export const metadata: Metadata = {
  title: 'Function Atlas — StableGrid',
  description:
    'Pick the right pyspark.sql.functions entry. Eight branches — dates, regex, JSON, windows, aggregates, higher-order, casting, nulls.',
  alternates: { canonical: '/practice/function-atlas' },
  robots: { index: false, follow: false }
};

export default function FunctionAtlasPage() {
  return (
    <ComingSoonCategory
      eyebrow="Function Atlas"
      title="Pick the right function. Fast."
      description="Eight branches of pyspark.sql.functions — dates, regex, JSON, windows, aggregates, higher-order, casting, nulls. One-line outcome plus a sample row; pick the smallest correct expression. The pairs you keep googling, trained until you don't."
    />
  );
}
