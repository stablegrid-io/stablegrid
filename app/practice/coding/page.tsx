import type { Metadata } from 'next';
import { CodingLanguageSelector } from '@/components/practice/CodingLanguageSelector';

export const metadata: Metadata = {
  title: 'Coding Practice | stableGrid.io',
  description: 'Python, SQL, and PySpark coding challenges across Junior, Mid, and Senior levels.',
};

export default function CodingPracticePage() {
  return <CodingLanguageSelector />;
}
