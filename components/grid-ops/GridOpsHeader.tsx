import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';

export function GridOpsHeader() {
  return (
    <header className="rounded-2xl border border-[#dce2ea] bg-white/80 px-4 py-3 shadow-sm backdrop-blur dark:border-[#2a323f] dark:bg-[#11151c]/90">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.2em] text-[#44566f] dark:text-[#98accc]">
          Grid Stabilization Operations
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border border-[#c3cedd] bg-white px-3 py-1.5 text-sm font-medium text-[#273548] transition hover:border-brand-500/60 dark:border-[#313a49] dark:bg-[#161c25] dark:text-[#dbe5f5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>
      </div>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#152233] dark:text-[#edf2fb] md:text-3xl">
            Restore the Iberian Grid
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-[#4d6078] dark:text-[#a8b5c9]">
            Convert learning output into deployment power. Stabilize nodes, reduce blackout risk,
            and activate new regions under live grid pressure.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
          <Zap className="h-3.5 w-3.5" />
          Operation Stability Horizon
        </div>
      </div>
    </header>
  );
}
