import type { Metadata } from 'next';
import { CodingLanguagePicker } from '@/components/practice/CodingLanguagePicker';

export const metadata: Metadata = {
  title: 'Coding Practice | stablegrid.io',
  description: 'Pick PySpark, Python, or SQL and drill the functions data engineers use every day.',
  robots: { index: false, follow: false },
};

export default function CodingPracticePage() {
  return <CodingLanguagePicker />;
}
