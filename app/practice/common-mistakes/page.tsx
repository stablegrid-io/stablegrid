import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';
import { BreadcrumbJsonLd } from '@/lib/seo/jsonLd';

export const metadata: Metadata = {
  title: 'Common Mistakes — StableGrid',
  description:
    'Focused drills on the PySpark pitfalls that keep biting people.',
  alternates: { canonical: '/practice/common-mistakes' },
  robots: { index: true, follow: true }
};

export default function CommonMistakesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Practice', url: '/practice' },
          { name: 'Common Mistakes', url: '/practice/common-mistakes' },
        ]}
      />
      <ComingSoonCategory
        eyebrow="Common Mistakes"
        title="Stop tripping on the classics."
        description="Focused drills on the PySpark pitfalls that keep biting people: lazy evaluation, broadcast vs shuffle, null semantics, partition skew."
      />
    </>
  );
}
