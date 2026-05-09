export default function WorkspaceLoading() {
  return (
    <main className="min-h-screen px-6 pb-10 pt-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="h-10 w-1/2 animate-pulse bg-surface-container" />
        <div className="h-24 animate-pulse border border-surface-dim bg-surface-container" />
        <div className="h-[60vh] animate-pulse border border-surface-dim bg-surface-container" />
      </div>
    </main>
  );
}
