export default function WorkspaceLoading() {
  return (
    <main className="min-h-screen px-6 pb-10 pt-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-light-hover dark:bg-dark-hover" />
        <div className="h-24 animate-pulse rounded-3xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface" />
        <div className="h-[60vh] animate-pulse rounded-3xl border border-light-border bg-light-surface dark:border-dark-border dark:bg-dark-surface" />
      </div>
    </main>
  );
}
