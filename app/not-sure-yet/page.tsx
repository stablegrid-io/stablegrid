import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Not sure yet? · stableGrid.io',
  description:
    'A concise overview of who stableGrid is for, what you get, and how quickly you can see value.'
};

const VALUE_POINTS = [
  'Learn by doing with theory, tasks, missions, and a live grid simulation.',
  'Build practical PySpark and Microsoft Fabric confidence, not only passive knowledge.',
  'Track progress clearly and convert effort into kWh game outcomes.'
] as const;

const FIT_SIGNALS = [
  'You want structure, but still need hands-on practice.',
  'You are moving toward data engineering, analytics, or operations workflows.',
  'You prefer short modules over long, open-ended courses.'
] as const;

export default function NotSureYetPage() {
  return (
    <main className="min-h-screen bg-black px-5 pb-16 pt-20 text-[#e6ece8] sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-[1.8rem] border border-white/16 bg-[linear-gradient(160deg,rgba(8,12,14,0.96),rgba(6,9,10,0.92)_52%,rgba(5,7,8,0.95)_100%)] px-6 py-8 shadow-[0_28px_80px_rgba(0,0,0,0.48)] sm:px-10 sm:py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9fb3a8]">
            Quick clarity
          </p>
          <h1 className="mt-3 text-[clamp(1.85rem,4.7vw,3.2rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#f2f7f4]">
            Not sure yet?
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[#bed0c8] sm:text-[17px]">
            stableGrid helps you build real big-data confidence through guided learning and applied
            practice. You do not need to commit upfront to one long path.
          </p>

          <div className="mt-7 grid gap-3">
            {VALUE_POINTS.map((point) => (
              <div
                key={point}
                className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/[0.03] px-4 py-3"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9fc0af]" />
                <p className="text-[14px] leading-6 text-[#d3dfd9] sm:text-[15px]">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/12 bg-white/[0.02] px-4 py-4 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a8b7b1]">
              Good fit if
            </p>
            <ul className="mt-3 space-y-2 text-[14px] leading-6 text-[#cad7d1] sm:text-[15px]">
              {FIT_SIGNALS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-[#6f7984] bg-[#a7b0b8] px-5 py-3 text-sm font-medium text-[#11161c] transition-colors hover:bg-[#c4ccd3]"
            >
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#9fb3a8] transition-colors hover:text-[#d6e2dc]"
            >
              Back to landing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
