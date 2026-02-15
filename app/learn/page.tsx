import { HomeSearch } from '@/components/home/home/HomeSearch';
import { TopicGrid } from '@/components/learn/TopicGrid';
import { learnTopics } from '@/data/learn';
import { learnSearchItems } from '@/lib/learn-search';

export default function LearnPage() {
  return (
    <main className="min-h-screen pb-20 lg:pb-8">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-10 max-w-2xl">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-brand-500">
              Reference Library
            </p>
            <h1 className="mb-3 text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Learning Materials
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Browse topic cheat sheets, search concepts instantly, and open deep
              documentation with practical examples.
            </p>
          </header>

          <div className="mb-8">
            <HomeSearch items={learnSearchItems} />
          </div>

          <TopicGrid topics={learnTopics} />
        </div>
      </div>
    </main>
  );
}
