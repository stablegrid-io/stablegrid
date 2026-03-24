import type { FeedbackMetric } from '@/components/admin/feedback/types';

export function FeedbackKpiRow({ metrics }: { metrics: FeedbackMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric) => (
        <article
          key={metric.label}
          className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-5 backdrop-blur-2xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(153,247,255,0.03),transparent_70%)] pointer-events-none" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/40">
              {metric.label}
            </p>
            <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-on-surface">
              {metric.value}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-on-surface-variant/35">{metric.hint}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
