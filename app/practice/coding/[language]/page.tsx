import type { Metadata } from 'next';
import { CodingPracticeLevels } from '@/components/practice/CodingPracticeLevels';

interface Props {
  params: { language: string };
}

export function generateMetadata({ params }: Props): Metadata {
  const lang = params.language.charAt(0).toUpperCase() + params.language.slice(1);
  return {
    title: `${lang} Coding Practice | stablegrid.io`,
    description: `${lang} coding challenges across Junior, Mid, and Senior levels.`,
  };
}

export function generateStaticParams() {
  return [{ language: 'python' }, { language: 'sql' }, { language: 'pyspark' }];
}

export default function CodingLanguageLevelsPage({ params }: Props) {
  return <CodingPracticeLevels language={params.language} />;
}
