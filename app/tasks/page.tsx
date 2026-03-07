import Link from 'next/link';
import { ArrowRight, Flag, Layers3, NotebookPen } from 'lucide-react';

const TASKS = [
  {
    title: 'Notebooks',
    description: 'Review production-style notebooks and submit line-level audits.',
    href: '/practice/notebooks',
    cta: 'Open notebooks',
    icon: NotebookPen,
    badge: 'Review'
  },
  {
    title: 'Missions',
    description: 'Run scenario missions and close operational incidents.',
    href: '/missions',
    cta: 'Open missions',
    icon: Flag,
    badge: 'Operations'
  },
  {
    title: 'Flashcards',
    description: 'Practice rapid theory recall and keep continuity active.',
    href: '/flashcards',
    cta: 'Open flashcards',
    icon: Layers3,
    badge: 'Practice'
  }
] as const;

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-light-bg px-6 pb-20 pt-10 dark:bg-dark-bg">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 rounded-[1.8rem] border border-light-border bg-light-surface p-6 dark:border-dark-border dark:bg-dark-surface">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-500">
            Tasks
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
            Choose your active task
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-light-secondary dark:text-text-dark-secondary">
            Open notebooks, missions, or flashcards from one command surface.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {TASKS.map((task) => {
            const Icon = task.icon;
            return (
              <article
                key={task.href}
                className="rounded-[1.35rem] border border-light-border bg-light-surface p-5 shadow-[0_24px_64px_-52px_rgba(15,23,42,0.3)] dark:border-dark-border dark:bg-dark-surface dark:shadow-[0_24px_64px_-52px_rgba(0,0,0,0.7)]"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-400">
                  <Icon className="h-3.5 w-3.5" />
                  {task.badge}
                </div>

                <h2 className="mt-3 text-xl font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {task.title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-light-secondary dark:text-text-dark-secondary">
                  {task.description}
                </p>

                <Link
                  href={task.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-light-border bg-light-bg px-3 py-2 text-sm font-semibold text-text-light-primary transition-colors hover:border-brand-500/45 hover:text-brand-700 dark:border-dark-border dark:bg-dark-bg dark:text-text-dark-primary dark:hover:border-brand-400/45 dark:hover:text-brand-300"
                >
                  {task.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
