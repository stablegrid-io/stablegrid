export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-light-border dark:bg-dark-border" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-light-border dark:bg-dark-border" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-2xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
