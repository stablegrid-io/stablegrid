import { permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'stablegrid.io',
  description: 'Learning topics and chapter content.'
};

export default function LearnPage() {
  permanentRedirect('/theory');
}
