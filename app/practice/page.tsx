import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPracticeSets } from '@/data/operations/practice-sets';
import { createClient } from '@/lib/supabase/server';
import { BreadcrumbJsonLd } from '@/lib/seo/jsonLd';

// Module-id → category mapper. Mirrors the regex used downstream so the
// category-completion count matches what /practice/* listing pages show.
function categorizeModuleId(moduleId: string): 'modules' | 'fundamentals' | null {
  if (/^module-(PS|PM|PX)\d+$/.test(moduleId)) return 'modules';
  if (/^module-FND-/i.test(moduleId)) return 'fundamentals';
  return null;
}

export const metadata: Metadata = {
  title: 'Practice — StableGrid',
  description:
    'Choose how to practice: drill the modules, recognise the fundamentals, speed-read the Spark UI, or master pyspark.sql.functions.',
  alternates: { canonical: '/practice' },
  robots: { index: true, follow: true }
};

interface Category {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string | null;
  meta: string;
  available: boolean;
  completed: number;
  total: number;
}

export default async function PracticePage() {
  const allSets = getPracticeSets('pyspark');
  const moduleSetCount = allSets.filter((set) =>
    /^module-(PS|PM|PX)\d+$/.test(set.metadata.moduleId)
  ).length;
  const fundamentalsSetCount = allSets.filter((set) =>
    /^module-FND-/i.test(set.metadata.moduleId)
  ).length;

  // Pull this user's completed-module ledger. Unauthenticated users — or any
  // DB hiccup — fall through to 0 completed, so the page still renders cleanly.
  let modulesCompleted = 0;
  let fundamentalsCompleted = 0;
  try {
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (user) {
      const { data: payouts } = await supabase
        .from('practice_module_payouts')
        .select('module_id')
        .eq('user_id', user.id)
        .eq('topic', 'pyspark');
      if (payouts) {
        for (const row of payouts) {
          const bucket = categorizeModuleId(row.module_id as string);
          if (bucket === 'modules') modulesCompleted++;
          else if (bucket === 'fundamentals') fundamentalsCompleted++;
        }
      }
    }
  } catch {
    // Swallow — render with zero progress.
  }

  const fmtMeta = (done: number, total: number) =>
    done > 0 ? `${done} / ${total} sets` : `${total} sets`;

  const categories: Category[] = [
    {
      slug: 'modules',
      eyebrow: 'Module Practice',
      title: 'Drill what you just read.',
      description:
        'PySpark practice sets paired one-to-one with each theory module, across Junior, Mid, and Senior tracks.',
      href: '/practice/modules',
      meta: fmtMeta(modulesCompleted, moduleSetCount),
      available: true,
      completed: modulesCompleted,
      total: moduleSetCount
    },
    {
      slug: 'fundamentals',
      eyebrow: 'Fundamentals',
      title: 'Recognize the trap before it bites.',
      description:
        'Recognition drills across eight PySpark fundamentals — joins, plans, layout, memory, streaming, aggregations, manipulation, optimization. ~10 MCQs per module.',
      href: '/practice/fundamentals',
      meta: fmtMeta(fundamentalsCompleted, fundamentalsSetCount),
      available: true,
      completed: fundamentalsCompleted,
      total: fundamentalsSetCount
    },
    {
      slug: 'spark-ui-speed-reading',
      eyebrow: 'Spark UI Speed Reading',
      title: 'One screenshot. Sixty seconds.',
      description:
        'Stage timelines, executor heatmaps, SQL DAGs, query-plan trees. You have one minute to call the bottleneck. Production debugging is rarely contemplative.',
      href: '/practice/spark-ui-speed-reading',
      meta: 'Coming soon',
      available: false,
      completed: 0,
      total: 0
    },
    {
      slug: 'function-atlas',
      eyebrow: 'Function Atlas',
      title: 'Pick the right function. Fast.',
      description:
        'Eight branches of pyspark.sql.functions — dates, regex, JSON, windows, aggregates, higher-order, casting, nulls. The pairs you keep googling.',
      href: '/practice/function-atlas',
      meta: 'Coming soon',
      available: false,
      completed: 0,
      total: 0
    }
  ];

  return (
    <main className="bg-surface min-h-[calc(100dvh-4rem)]">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Practice', url: '/practice' },
        ]}
      />
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16">
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
            Theory teaches the moves; practice makes them reflex. Each category trains a different muscle — module drills cement chapters, fundamentals catch production traps, Spark UI drills sharpen triage, the function atlas trains API recall. Pick the loop you’re weakest in.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-px bg-outline-variant border border-outline-variant">
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

                  <div className="mt-6 pt-4 border-t border-outline-variant">
                    {/* Cell-row progress bar (DESIGN.md). 8 cells: filled
                        cells = `bg-spark` for completed modules in the
                        category; remaining = hairline outline. The fill is
                        proportional, rounded down so we never claim more
                        progress than actually exists. */}
                    {(() => {
                      const CELLS = 8;
                      const filled =
                        category.total > 0
                          ? Math.min(
                              CELLS,
                              Math.floor((category.completed / category.total) * CELLS)
                            )
                          : 0;
                      const pct =
                        category.total > 0
                          ? Math.round((category.completed / category.total) * 100)
                          : 0;
                      return (
                        <>
                          <div
                            className="flex gap-1 mb-3"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${category.eyebrow}: ${category.completed} of ${category.total} sets complete`}
                          >
                            {Array.from({ length: CELLS }).map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < filled
                                    ? 'h-2 flex-1 bg-spark'
                                    : `h-2 flex-1 border ${
                                        dim ? 'border-outline-variant' : 'border-outline'
                                      }`
                                }
                              />
                            ))}
                          </div>
                          <span
                            className={`font-data-mono uppercase text-[10px] tracking-wider ${
                              dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                            }`}
                          >
                            {category.meta}
                          </span>
                        </>
                      );
                    })()}
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
