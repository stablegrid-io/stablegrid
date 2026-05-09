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
  const moduleSetCount = getPracticeSets('pyspark').filter((set) =>
    /^module-(PS|PM|PX)\d+$/.test(set.metadata.moduleId)
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
      slug: 'common-mistakes',
      eyebrow: 'Common Mistakes',
      title: 'Stop tripping on the classics.',
      description:
        'Focused drills on the PySpark pitfalls that keep biting people: lazy evaluation, broadcast vs shuffle, null semantics, partition skew.',
      href: '/practice/common-mistakes',
      meta: 'Coming soon',
      available: false
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
        <header className="mb-16">
          <h1 className="font-h1 text-h1 text-on-surface mb-3">Practice</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            Pick a drill style. Each category trains a different muscle.
          </p>
          <div className="border-b border-on-surface mt-8" />
        </header>

        <ul className="flex flex-col">
          {categories.map((category, idx) => {
            const padded = (idx + 1).toString().padStart(2, '0');
            const dim = !category.available;
            return (
              <li key={category.slug} className="border-b border-surface-dim">
                <Link
                  href={category.href ?? '#'}
                  aria-label={category.eyebrow}
                  className="block hover:bg-surface-container-low transition-colors"
                >
                  <div className="grid grid-cols-[56px_1fr_auto_auto] items-start gap-6 py-6">
                    <span
                      className={`font-data-mono tabular-nums text-[13px] pl-2 pt-1 ${
                        dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                      }`}
                    >
                      {padded}
                    </span>
                    <div className="min-w-0 flex flex-col gap-2">
                      <span
                        className={`font-data-mono uppercase text-[11px] tracking-wider ${
                          dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                        }`}
                      >
                        {category.eyebrow}
                      </span>
                      <span
                        className={`font-serif text-[22px] leading-snug ${
                          dim ? 'text-on-surface/50' : 'text-on-surface'
                        }`}
                      >
                        {category.title}
                      </span>
                      <span
                        className={`font-body text-[15px] leading-relaxed max-w-2xl ${
                          dim ? 'text-on-surface-variant/60' : 'text-on-surface-variant'
                        }`}
                      >
                        {category.description}
                      </span>
                    </div>
                    <span
                      className={`font-data-mono tabular-nums text-[13px] pr-4 pt-1 whitespace-nowrap ${
                        dim ? 'text-on-surface-variant/50' : 'text-on-surface-variant'
                      }`}
                    >
                      {category.meta}
                    </span>
                    <span
                      aria-hidden
                      className={`w-8 h-8 mr-2 mt-1 flex items-center justify-center ${
                        dim ? 'border border-surface-dim' : 'border border-on-surface'
                      }`}
                    >
                      <ArrowRight
                        className={`h-4 w-4 ${dim ? 'text-on-surface-variant/50' : 'text-on-surface'}`}
                        strokeWidth={1.75}
                      />
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
