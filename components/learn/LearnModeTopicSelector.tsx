import Link from 'next/link';
import { ArrowLeft, BookOpen, ChevronRight, Code2, Cpu, Database, Sparkles } from 'lucide-react';
import { getLearnTopicMeta, learnTopics } from '@/data/learn';

type LearnMode = 'theory' | 'functions';

interface LearnModeTopicSelectorProps {
  mode: LearnMode;
}

const TOPIC_ICON_MAP: Record<string, typeof Database> = {
  sql: Database,
  pyspark: Sparkles,
  python: Code2,
  fabric: Cpu
};

const MODE_META: Record<
  LearnMode,
  {
    badge: string;
    title: string;
    description: string;
    cta: string;
    statLabel: 'chapters' | 'functions';
  }
> = {
  theory: {
    badge: 'Theory Library',
    title: 'Pick a theory topic',
    description:
      'Choose PySpark, SQL, Python, or Fabric and then open chapter categories.',
    cta: 'Open Theory',
    statLabel: 'chapters'
  },
  functions: {
    badge: 'Function Library',
    title: 'Pick a functions topic',
    description:
      'Choose a topic to browse searchable function references and examples.',
    cta: 'Open Functions',
    statLabel: 'functions'
  }
};

export function LearnModeTopicSelector({ mode }: LearnModeTopicSelectorProps) {
  const meta = MODE_META[mode];

  return (
    <main className="min-h-screen pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/learn"
            className="mb-8 inline-flex items-center gap-2 text-sm text-text-light-tertiary transition-colors hover:text-brand-500 dark:text-text-dark-tertiary"
          >
            <ArrowLeft className="h-4 w-4" />
            All learning
          </Link>

          <header className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              {meta.badge}
            </p>
            <h1 className="mb-3 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {meta.title}
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              {meta.description}
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {learnTopics.map((topic) => {
              const topicMeta = getLearnTopicMeta(topic.id);
              const Icon = TOPIC_ICON_MAP[topic.id] ?? Database;
              const statValue =
                meta.statLabel === 'chapters'
                  ? topicMeta?.chapterCount ?? topic.chapterCount
                  : topic.functionCount;

              return (
                <Link
                  key={`${mode}-${topic.id}`}
                  href={`/learn/${topic.id}/${mode}`}
                  className="card card-hover group p-6"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-muted dark:bg-dark-muted">
                      <Icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                      {statValue} {meta.statLabel}
                    </span>
                  </div>

                  <h3 className="mb-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    {topic.description}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
                    {meta.cta}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
