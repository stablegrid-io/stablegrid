import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPracticeSets } from '@/data/operations/practice-sets';

export const metadata: Metadata = {
  title: 'Practice — StableGrid',
  description:
    'Choose how to practice: drill the modules, hammer common mistakes, prep for interviews, or debug.',
  alternates: { canonical: '/practice' },
  robots: { index: false, follow: false }
};

interface Category {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string | null;
  meta: string;
  available: boolean;
}

export default function PracticePage() {
  const allSets = getPracticeSets('pyspark');
  const moduleSetCount = allSets.filter((set) =>
    /^module-(PS|PM|PX)\d+$/.test(set.metadata.moduleId)
  ).length;
  const fundamentalsSetCount = allSets.filter((set) =>
    /^module-FND-/i.test(set.metadata.moduleId)
  ).length;

  const categories: Category[] = [
    {
      slug: 'modules',
      eyebrow: 'Module Practice',
      title: 'Drill what you just read.',
      description:
        'PySpark practice sets paired one-to-one with each theory module, across Junior, Mid, and Senior tracks.',
      href: '/practice/modules',
      meta: `${moduleSetCount} sets`,
      available: true
    },
    {
      slug: 'fundamentals',
      eyebrow: 'Fundamentals',
      title: 'Recognize the trap before it bites.',
      description:
        'Recognition drills across seven PySpark fundamentals — joins, plans, layout, memory, streaming, aggregations, manipulation. ~10 MCQs per module.',
      href: '/practice/fundamentals',
      meta: `${fundamentalsSetCount} sets`,
      available: true
    },
    {
      slug: 'interview-prep',
      eyebrow: 'Interview Prep',
      title: 'Time-boxed, interview-flavored.',
      description:
        'Whiteboard-style PySpark questions framed the way interviewers actually ask them. Constraints, edge cases, follow-ups.',
      href: '/practice/interview-prep',
      meta: 'Coming soon',
      available: false
    },
    {
      slug: 'debugging-drills',
      eyebrow: 'Debugging Drills',
      title: 'Find the bug. Fix the bug.',
      description:
        'Snippets that almost work. Read the code, spot the defect, ship the fix. Different muscle from writing from scratch.',
      href: '/practice/debugging-drills',
      meta: 'Coming soon',
      available: false
    }
  ];

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <div className="max-w-[1200px] mx-auto px-12 py-16">
        {/* Header — matches /theory and /practice/modules: PySpark wordmark
            + orange star mark. Section title omitted. */}
        <header className="mb-16">
          <h1 className="flex items-center gap-3 font-h1 text-h1 leading-none">
            <span>
              <span className="text-primary">Py</span>
              <span className="text-on-surface">Spark</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/pyspark-track-star.svg"
              alt=""
              aria-hidden="true"
              className="h-12 sm:h-14 w-auto shrink-0"
            />
          </h1>
          <p className="mt-5 font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Reading the theory teaches you the moves; practice is where they become reflex. Each category below trains a different muscle — module drills cement what a chapter just taught, fundamentals build the recognition layer that catches production traps before they ship, and the rest sharpen the pattern-matching that interviews and incident reviews live on. Pick the loop you’re weakest in, not the one you already enjoy.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-surface-dim border border-surface-dim">
          {categories.map((category, idx) => {
            const padded = (idx + 1).toString().padStart(2, '0');
            const dim = !category.available;
            return (
              <li key={category.slug} className="bg-surface flex">
                <Link
                  href={category.href ?? '#'}
                  aria-label={category.eyebrow}
                  className="group flex flex-col w-full p-6 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-start justify-between mb-6">
                    <span
                      className={`font-data-mono tabular-nums text-[13px] ${
                        dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                      }`}
                    >
                      {padded}
                    </span>
                    <span
                      aria-hidden
                      className={`w-8 h-8 flex items-center justify-center ${
                        dim ? 'border border-surface-dim' : 'border border-on-surface'
                      }`}
                    >
                      <ArrowRight
                        className={`h-4 w-4 ${
                          dim ? 'text-on-surface-variant/50' : 'text-on-surface'
                        }`}
                        strokeWidth={1.75}
                      />
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 flex-1">
                    <span
                      className={`font-data-mono uppercase text-[11px] tracking-wider ${
                        dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                      }`}
                    >
                      {category.eyebrow}
                    </span>
                    <span
                      className={`font-serif text-[22px] leading-snug mb-2 ${
                        dim ? 'text-on-surface/50' : 'text-on-surface'
                      }`}
                    >
                      {category.title}
                    </span>
                    <span
                      className={`font-body text-[14px] leading-relaxed ${
                        dim ? 'text-on-surface-variant/60' : 'text-on-surface-variant'
                      }`}
                    >
                      {category.description}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-surface-dim">
                    <span
                      className={`font-data-mono uppercase text-[10px] tracking-wider ${
                        dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                      }`}
                    >
                      {category.meta}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
