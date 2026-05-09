import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';

export const metadata: Metadata = {
  title: 'Debugging Drills — StableGrid',
  description:
    'Snippets that almost work. Read the code, spot the defect, ship the fix.',
  alternates: { canonical: '/practice/debugging-drills' },
  robots: { index: false, follow: false }
};

export default function DebuggingDrillsPage() {
  return (
    <ComingSoonCategory
      eyebrow="Debugging Drills"
      title="Find the bug. Fix the bug."
      description="Snippets that almost work. Read the code, spot the defect, ship the fix. Different muscle from writing from scratch."
    />
  );
}
