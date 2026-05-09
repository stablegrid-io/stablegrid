export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="h-8 w-56 animate-pulse bg-surface-container" />
        <div className="h-4 w-96 max-w-full animate-pulse bg-surface-container" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse border border-surface-dim bg-surface-container-low"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
