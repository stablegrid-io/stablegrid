import Link from 'next/link';
import { BookOpen, ChevronRight, Code2, Search } from 'lucide-react';
import { LearnSearchPanel } from '@/components/home/home/LearnSearchPanel';
import { learnTopics } from '@/data/learn';

export default function LearnPage() {
  const topicCount = learnTopics.length;
  const totalChapters = learnTopics.reduce(
    (sum, topic) => sum + topic.chapterCount,
    0
  );
  const totalFunctions = learnTopics.reduce(
    (sum, topic) => sum + topic.functionCount,
    0
  );

  return (
    <main className="min-h-screen pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Learn Hub
            </p>
            <h1 className="mb-3 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Choose your learning mode
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Pick a track first, then choose your topic. Theory and Functions are
              now separate flows to keep navigation focused.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link href="/learn/theory" className="card card-hover group p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-muted dark:bg-dark-muted">
                  <BookOpen className="h-5 w-5 text-brand-500" />
                </div>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                  {totalChapters} chapters
                </span>
              </div>
              <h2 className="mb-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Theory
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Chapter-based reading path across {topicCount} topics with progress
                tracking and completion milestones.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400">
                Open Theory Topics
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>

            <Link href="/learn/functions" className="card card-hover group p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-light-muted dark:bg-dark-muted">
                  <Code2 className="h-5 w-5 text-success-500" />
                </div>
                <span className="rounded-full border border-light-border bg-light-bg px-2.5 py-1 text-xs font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-secondary">
                  {totalFunctions} functions
                </span>
              </div>
              <h2 className="mb-1 text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                Functions
              </h2>
              <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                Searchable API reference with signatures, examples, and quick
                snippets for SQL, PySpark, Python, and Fabric.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-success-600 dark:text-success-400">
                Open Function Topics
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          </div>

          <section className="mt-8 rounded-2xl border border-light-border bg-light-surface p-5 dark:border-dark-border dark:bg-dark-surface">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              <Search className="h-4 w-4 text-brand-500" />
              Search across learning content
            </div>
            <LearnSearchPanel />
          </section>
        </div>
      </div>
    </main>
  );
}
