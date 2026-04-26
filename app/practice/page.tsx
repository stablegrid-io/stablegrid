import type { Metadata } from 'next';
import { PracticeHub } from '@/components/practice/PracticeHub';

export const metadata: Metadata = {
  title: 'Practice',
  description: 'Sharpen your skills across coding, logic, math & statistics, and grid & electricity challenges.',
  robots: { index: false, follow: false },
};

export default function PracticePage() {
  return <PracticeHub />;
}
