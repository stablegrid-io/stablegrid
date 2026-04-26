import type { Metadata } from 'next';
import { OperationsHub } from './OperationsHub';

export const metadata: Metadata = {
  title: 'Operations | stablegrid',
  description: 'Practice sets and missions to reinforce your data engineering skills.'
};

export default function OperationsPage() {
  return <OperationsHub />;
}
