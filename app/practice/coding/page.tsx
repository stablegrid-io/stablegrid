import type { Metadata } from 'next';
import { CodingLanguageSelector } from '@/components/practice/CodingLanguageSelector';

export const metadata: Metadata = {
  title: 'Coding Practice | stablegrid.io',
  description: 'Python, SQL, and PySpark coding challenges across Junior, Mid, and Senior levels.',
  robots: { index: false, follow: false },
};

export default function CodingPracticePage() {
  return <CodingLanguageSelector />;
}
