import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function GridOpsHeader() {
  return (
    <header className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(13,18,25,0.9),rgba(8,12,18,0.95))] px-5 py-4 shadow-[0_26px_80px_-48px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(144,216,196,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(126,170,255,0.12),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/28 to-transparent" />

      <div className="relative flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.2em] text-[#8fa4bd]">
          Grid Stabilization Operations
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-sm font-medium text-[#dde7f5] transition hover:border-white/20 hover:bg-white/[0.07]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </div>

      <div className="relative mt-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#edf3fb] md:text-3xl">
            Restore the Iberian Grid
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[#a6b6c9]">
            Convert learning output into deployment power. Stabilize nodes, reduce blackout risk,
            and activate new regions under live grid pressure.
          </p>
        </div>
      </div>
    </header>
  );
}
