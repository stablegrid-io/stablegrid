import type { Metadata } from 'next';
import CheatSheetsClient from './CheatSheetsClient';

export const metadata: Metadata = {
  title: 'Cheat Sheets — PySpark, Fabric, Airflow, SQL, Python',
  description:
    'Per-module cheat sheets across every track: core concepts, key patterns, watch-outs, and insights. Printable PDF export.',
  alternates: { canonical: '/cheat-sheets' },
  openGraph: {
    title: 'Cheat Sheets — StableGrid',
    description:
      'Module-level cheat sheets for PySpark, Fabric, Airflow, SQL, and Python tracks.',
    url: 'https://stablegrid.io/cheat-sheets',
  },
};

export default function CheatSheetsPage() {
  return <CheatSheetsClient />;
}
