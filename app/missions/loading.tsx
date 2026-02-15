export default function HubLoading() {
  return (
    <main className="min-h-screen px-6 pb-16 pt-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="h-6 w-32 animate-pulse rounded-full bg-light-hover dark:bg-dark-hover" />
        <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-light-hover dark:bg-dark-hover" />
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
