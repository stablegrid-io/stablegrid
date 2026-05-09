import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';

export const metadata: Metadata = {
  title: 'Common Mistakes — StableGrid',
  description:
    'Focused drills on the PySpark pitfalls that keep biting people.',
  alternates: { canonical: '/practice/common-mistakes' },
  robots: { index: false, follow: false }
};

export default function CommonMistakesPage() {
  return (
    <ComingSoonCategory
      eyebrow="Common Mistakes"
      title="Stop tripping on the classics."
      description="Focused drills on the PySpark pitfalls that keep biting people: lazy evaluation, broadcast vs shuffle, null semantics, partition skew."
    />
  );
}
