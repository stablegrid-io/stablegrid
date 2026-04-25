import type { Metadata } from 'next';
import { CodingPracticeTreeMap } from '@/components/practice/CodingPracticeTreeMap';

interface Props {
  params: { language: string; level: string };
}

const LANG_LABELS: Record<string, string> = {
  python: 'Python',
  sql: 'SQL',
  pyspark: 'PySpark',
};

export function generateMetadata({ params }: Props): Metadata {
  const lang = LANG_LABELS[params.language] ?? params.language;
  const level = params.level.charAt(0).toUpperCase() + params.level.slice(1);
  return {
    title: `${lang} ${level} | stableGrid.io`,
    description: `${lang} ${level}-level coding practice tree map.`,
  };
}

export function generateStaticParams() {
  const languages = ['python', 'sql', 'pyspark'];
  const levels = ['junior', 'mid', 'senior'];
  return languages.flatMap((language) =>
    levels.map((level) => ({ language, level }))
  );
}

export default function CodingPracticeLevelPage({ params }: Props) {
  return <CodingPracticeTreeMap language={params.language} level={params.level} />;
}
