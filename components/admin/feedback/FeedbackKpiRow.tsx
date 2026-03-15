import type { FeedbackMetric } from '@/components/admin/feedback/types';

export function FeedbackKpiRow({ metrics }: { metrics: FeedbackMetric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="rounded-[20px] border border-white/10 bg-white/[0.035] px-4 py-4 shadow-[0_20px_40px_-34px_rgba(0,0,0,0.85)]"
        >
          <p className="text-[0.64rem] uppercase tracking-[0.18em] text-[#7f948b]">
            {metric.label}
          </p>
          <p className="mt-3 text-[1.65rem] font-semibold tracking-[-0.03em] text-white">
            {metric.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#8ea39a]">{metric.hint}</p>
        </article>
      ))}
    </section>
  );
}
