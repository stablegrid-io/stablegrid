import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'stableGrid.io',
  description: 'Learning topics and chapter content.'
};

export default function LearnPage() {
  redirect('/learn/theory');
}
