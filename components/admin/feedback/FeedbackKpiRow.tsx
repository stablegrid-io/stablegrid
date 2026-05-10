import {
  ADMIN_SECONDARY_SURFACE_CLASS,
  ADMIN_FIELD_LABEL_CLASS,
} from '@/components/admin/theme';
import type { FeedbackMetric } from '@/components/admin/feedback/types';

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
            className={`${ADMIN_SECONDARY_SURFACE_CLASS} relative overflow-hidden`}
          >
            <div className="relative flex h-full min-h-[10.5rem] flex-col px-5 py-5">
              <p className={`${ADMIN_FIELD_LABEL_CLASS} leading-tight`}>
                {metric.label}
              </p>
              {numeric ? (
                <p className="mt-3 font-data-mono text-3xl font-bold tabular-nums tracking-tight text-on-surface leading-none">
                  {metric.value}
                </p>
              ) : (
                <p className="mt-3 font-h2 text-[1.125rem] font-semibold tracking-tight text-on-surface leading-snug line-clamp-2">
                  {metric.value}
                </p>
              )}
              <p className="mt-auto pt-3 font-body text-[12px] leading-relaxed text-on-surface-variant line-clamp-3">
                {metric.hint}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
