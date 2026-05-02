import type { FeedbackMetric } from '@/components/admin/feedback/types';

const ACCENT = '153,247,255';

/* The metric value can be a number, percentage, ratio, OR a string label like
   a category name. Numeric values get the bold tabular-nums treatment;
   string-y values get a tighter, lower-weight render so they don't blow up
   the card height when they wrap. */
const isNumericValue = (value: string) =>
  /^[+\-−]?\d+(?:[.,]\d+)?\s*(?:%|\/\s*\d+|\s*[a-zA-Z]+)?$/u.test(value.trim());

export function FeedbackKpiRow({ metrics }: { metrics: FeedbackMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {metrics.map((metric) => {
        const numeric = isNumericValue(metric.value);
        return (
          <article
            key={metric.label}
            className="group relative overflow-hidden rounded-[22px] transition-all duration-500 ease-out hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(180deg, #1c2025 0%, #181c20 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.04) inset, 0 16px 32px -20px rgba(0,0,0,0.6)',
            }}
          >
            {/* Subtle ambient glow anchored at top */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-70 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 70% 60% at 100% 0%, rgba(${ACCENT},0.05), transparent 70%)`,
              }}
            />
            {/* Apple-style top inset highlight */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              }}
            />

            <div className="relative flex h-full min-h-[10.5rem] flex-col px-5 py-5">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45 leading-tight">
                {metric.label}
              </p>
              {numeric ? (
                <p className="mt-3 text-[2rem] font-bold tracking-tight text-white font-mono tabular-nums leading-none">
                  {metric.value}
                </p>
              ) : (
                <p className="mt-3 text-[1.125rem] font-semibold tracking-tight text-white leading-snug line-clamp-2">
                  {metric.value}
                </p>
              )}
              <p className="mt-auto pt-3 text-[12px] leading-relaxed text-white/50 line-clamp-3">
                {metric.hint}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
