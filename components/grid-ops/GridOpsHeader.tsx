import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';

export function GridOpsHeader() {
  return (
    <header className="rounded-2xl border border-[#d7e8df] bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-[#224134] dark:bg-[#0c1511]/85">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.2em] text-[#3f6c56] dark:text-[#92c4a7]">
          Grid Stabilization Operations
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-[#bfd3c8] bg-white px-3 py-1.5 text-sm font-medium text-[#1f3428] transition hover:border-emerald-500/60 dark:border-[#2a4639] dark:bg-[#101b16] dark:text-[#d2eadb]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </div>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#122118] dark:text-[#e8f5ed] md:text-3xl">
            Restore the Iberian Grid
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[#446552] dark:text-[#9fc1b0]">
            Convert learning output into deployment power. Stabilize nodes, reduce blackout risk,
            and activate new regions under live grid pressure.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <Zap className="h-3.5 w-3.5" />
          Operation Stability Horizon
        </div>
      </div>
    </header>
  );
}
