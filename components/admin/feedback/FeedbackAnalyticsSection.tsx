import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { FeedbackAnalyticsSnapshot } from '@/components/admin/feedback/types';

const PANEL_CLASS =
  'relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-2xl';

const tooltipContentStyle = {
  borderRadius: '16px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(26, 29, 32, 0.95)',
  color: '#e6f1ec',
  backdropFilter: 'blur(24px)',
  boxShadow: '0 20px 40px -16px rgba(0, 0, 0, 0.85)',
  padding: '8px 14px',
  fontSize: '13px'
};

function PanelFrame({
  title,
  subtitle,
  children,
  className
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`${PANEL_CLASS} ${className ?? ''}`.trim()}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(153,247,255,0.02),transparent_60%)] pointer-events-none" />
      <div className="relative">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-on-surface">{title}</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant/35">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </article>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] text-[13px] text-on-surface-variant/30">
      {message}
    </div>
  );
}

function StatusOverview({ statuses }: Pick<FeedbackAnalyticsSnapshot, 'statuses'>) {
  const total = statuses.reduce((sum, status) => sum + status.value, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-full border border-white/[0.06] bg-white/[0.02]">
        <div className="flex h-2.5 w-full">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={
                status.label === 'Resolved'
                  ? 'bg-emerald-400/60'
                  : status.label === 'Reviewed'
                    ? 'bg-amber-300/50'
                    : status.label === 'Ignored'
                      ? 'bg-white/10'
                      : 'bg-primary/60'
              }
              style={{ width: `${status.percent}%` }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <div className="flex items-center gap-2.5 text-on-surface-variant/70">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${
                  status.label === 'Resolved'
                    ? 'bg-emerald-400/70'
                    : status.label === 'Reviewed'
                      ? 'bg-amber-300/60'
                      : status.label === 'Ignored'
                        ? 'bg-white/15'
                        : 'bg-primary/70'
                }`}
              />
              <span>{status.label}</span>
            </div>
            <span className="text-on-surface-variant/40">
              {status.value} of {total} · {status.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeywordCluster({ keywords }: Pick<FeedbackAnalyticsSnapshot, 'keywords'>) {
  if (keywords.length === 0) {
    return (
      <EmptyChartState message="Keyword clusters will appear once feedback starts repeating similar language." />
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {keywords.map((keyword) => (
        <div
          key={keyword.label}
          className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-[13px] text-on-surface-variant/60"
        >
          <span>{keyword.label}</span>
          <span className="ml-2 text-on-surface-variant/30">{keyword.value}</span>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel({ insights }: Pick<FeedbackAnalyticsSnapshot, 'insights'>) {
  return (
    <article className={PANEL_CLASS}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(153,247,255,0.02),transparent_60%)] pointer-events-none" />
      <div className="relative">
        <div className="mb-5">
          <h2 className="text-[15px] font-semibold tracking-tight text-on-surface">
            Feedback insights
          </h2>
          <p className="mt-1 text-[12px] text-on-surface-variant/35">
            Interpreted signals that help the team respond quickly without reading every row
            first.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {insights.map((insight) => (
            <div
              key={insight.title}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
            >
              <p className="text-[13px] font-semibold text-on-surface">{insight.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant/40">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function FeedbackAnalyticsSection({
  analytics
}: {
  analytics: FeedbackAnalyticsSnapshot;
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.9fr)]">
        <PanelFrame
          title="Feedback trend over time"
          subtitle="Track submission volume over the selected period."
        >
          {analytics.trend.length === 0 ? (
            <EmptyChartState message="Trend data will appear once feedback enters the selected range." />
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.trend}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ stroke: 'rgba(153,247,255,0.12)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8af1d5"
                    strokeWidth={2.5}
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 4,
                      stroke: '#0c0e10',
                      strokeWidth: 2,
                      fill: '#8af1d5'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelFrame>

        <PanelFrame
          title="Sentiment distribution"
          subtitle="How much feedback feels positive, neutral, or negative."
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,11rem)_1fr] md:items-center">
            {analytics.sentiments.every((entry) => entry.value === 0) ? (
              <EmptyChartState message="Sentiment data will populate with incoming feedback." />
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.sentiments}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="rgba(12,14,16,0.9)"
                      strokeWidth={2}
                    >
                      {analytics.sentiments.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipContentStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="space-y-2.5">
              {analytics.sentiments.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3"
                >
                  <div className="flex items-center gap-2.5 text-[13px] text-on-surface">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-medium text-on-surface">{entry.percent}%</p>
                    <p className="text-[11px] text-on-surface-variant/30">{entry.value} items</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PanelFrame>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <PanelFrame
          title="Ratings breakdown"
          subtitle="The shape of user satisfaction across the selected period."
        >
          {analytics.ratings.every((entry) => entry.value === 0) ? (
            <EmptyChartState message="Ratings will show up here once feedback includes scores." />
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.ratings}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[8, 8, 0, 0]}
                    fill="#8af1d5"
                    maxBarSize={42}
                    fillOpacity={0.7}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelFrame>

        <PanelFrame
          title="Top categories and themes"
          subtitle="Which topics are surfacing most often across the current selection."
        >
          {analytics.categories.length === 0 ? (
            <EmptyChartState message="Category themes will appear once feedback enters the selected range." />
          ) : (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.categories}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 26, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                    fill="#8bd8ff"
                    maxBarSize={18}
                    fillOpacity={0.6}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelFrame>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.9fr)]">
        <PanelFrame
          title="Recurring keywords and issue clusters"
          subtitle="Repeated language is often the fastest way to spot durable friction points."
        >
          <KeywordCluster keywords={analytics.keywords} />
        </PanelFrame>

        <PanelFrame
          title="Status overview"
          subtitle="How much feedback is still open versus already resolved."
        >
          <StatusOverview statuses={analytics.statuses} />
        </PanelFrame>
      </section>

      <InsightsPanel insights={analytics.insights} />
    </div>
  );
}
