'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Code2, Clock } from 'lucide-react';

interface TopicModeMeta {
  topic: string;
  title: string;
  description: string;
  version?: string;
  chapterCount: number;
  chapterMinutes: number;
  functionCount: number;
}

interface ModeSelectorProps {
  meta: TopicModeMeta;
}

export const ModeSelector = ({ meta }: ModeSelectorProps) => {
  return (
    <div className="min-h-screen bg-light-bg pb-24 dark:bg-dark-bg lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <p className="mb-1 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              {meta.version ?? 'Learning Topic'}
            </p>
            <h1 className="text-3xl font-bold">{meta.title}</h1>
            <p className="mt-2 text-text-light-secondary dark:text-text-dark-secondary">
              {meta.description}
            </p>
          </motion.header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="h-full"
            >
              <Link
                href={`/learn/${meta.topic}/theory`}
                className="card card-hover flex h-full flex-col p-8"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 dark:border-brand-800 dark:bg-brand-900/20">
                  <BookOpen className="h-7 w-7 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="mb-6 min-h-[108px]">
                  <h2 className="mb-2 text-xl font-bold">Theory</h2>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Chapter-based conceptual documentation with architecture,
                    execution model, and optimization strategy.
                  </p>
                </div>
                <div className="mb-6 min-h-[44px] space-y-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    {meta.chapterCount} chapters
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {meta.chapterMinutes} min total
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400">
                  Start Reading
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="h-full"
            >
              <Link
                href={`/learn/${meta.topic}/functions`}
                className="card card-hover flex h-full flex-col p-8"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20">
                  <Code2 className="h-7 w-7 text-success-600 dark:text-success-400" />
                </div>
                <div className="mb-6 min-h-[108px]">
                  <h2 className="mb-2 text-xl font-bold">Functions</h2>
                  <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                    Interactive reference with search, filter, examples, and
                    copy-to-clipboard snippets.
                  </p>
                </div>
                <div className="mb-6 min-h-[44px] space-y-1 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5" />
                    {meta.functionCount} entries
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-success-600 dark:text-success-400">
                  Open Reference
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
