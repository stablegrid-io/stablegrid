import dynamic from 'next/dynamic';

const FlashcardsPage = dynamic(() => import('@/components/hub/FlashcardsPage'), {
  loading: () => (
    <main className="min-h-screen bg-light-bg px-6 pb-16 pt-10 dark:bg-dark-bg">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="h-10 w-60 animate-pulse rounded-lg bg-light-border dark:bg-dark-border" />
        <div className="h-24 animate-pulse rounded-2xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface" />
        <div className="grid gap-6">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-[320px] animate-pulse rounded-[32px] border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
            />
          ))}
        </div>
      </div>
    </main>
  )
});

export default function FlashcardsRoutePage() {
  return <FlashcardsPage />;
}
