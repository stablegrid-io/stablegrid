import type { Metadata } from 'next';
import { OperationsHub } from './OperationsHub';

export const metadata: Metadata = {
  title: 'Operations',
  description: 'Practice sets and missions to reinforce your data engineering skills.',
  robots: { index: false, follow: false }
};

export default function OperationsPage() {
  return <OperationsHub />;
}
