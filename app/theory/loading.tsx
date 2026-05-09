export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/30">Loading</p>
      </div>
    </div>
  );
}
