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
    <div className="min-h-screen bg-surface pb-24 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <p className="mb-1 font-mono font-bold uppercase tracking-[0.24em] text-[11px] text-primary">
              {meta.version ?? 'Learning Topic'}
            </p>
            <h1 className="text-3xl font-bold">{meta.title}</h1>
            <p className="mt-2 text-on-surface-variant">
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
                <div className="mb-6 flex h-14 w-14 items-center justify-center border border-primary-fixed bg-primary-fixed">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div className="mb-6 min-h-[108px]">
                  <h2 className="mb-2 text-xl font-bold">Theory</h2>
                  <p className="text-sm text-on-surface-variant">
                    Chapter-based conceptual documentation with architecture,
                    execution model, and optimization strategy.
                  </p>
                </div>
                <div className="mb-6 min-h-[44px] space-y-1 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    {meta.chapterCount} chapters
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    {meta.chapterMinutes} min total
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-primary-dim">
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
                <div className="mb-6 flex h-14 w-14 items-center justify-center border border-success-200 bg-success-50">
                  <Code2 className="h-7 w-7 text-success-600" />
                </div>
                <div className="mb-6 min-h-[108px]">
                  <h2 className="mb-2 text-xl font-bold">Functions</h2>
                  <p className="text-sm text-on-surface-variant">
                    Interactive reference with search, filter, examples, and
                    copy-to-clipboard snippets.
                  </p>
                </div>
                <div className="mb-6 min-h-[44px] space-y-1 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-3.5 w-3.5" />
                    {meta.functionCount} entries
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-success-600">
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
