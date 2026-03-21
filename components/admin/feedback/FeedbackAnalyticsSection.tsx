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
  'rounded-[24px] border border-outline-variant/20 bg-surface-container-low/68 p-5 shadow-[0_24px_45px_-35px_rgba(0,0,0,0.9)]';

const tooltipContentStyle = {
  borderRadius: '14px',
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(9, 14, 14, 0.94)',
  color: '#e6f1ec',
  boxShadow: '0 20px 32px -24px rgba(0, 0, 0, 0.9)'
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
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-on-surface">{title}</h2>
          <p className="mt-1 text-sm text-[#8ea39a]">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center  border border-dashed border-outline-variant/20 bg-white/[0.02] text-sm text-[#8ea39a]">
      {message}
    </div>
  );
}

function StatusOverview({ statuses }: Pick<FeedbackAnalyticsSnapshot, 'statuses'>) {
  const total = statuses.reduce((sum, status) => sum + status.value, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden  border border-outline-variant/20 bg-surface-container-low">
        <div className="flex h-3 w-full">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={
                status.label === 'Resolved'
                  ? 'bg-emerald-300/75'
                  : status.label === 'Reviewed'
                    ? 'bg-amber-200/70'
                    : status.label === 'Ignored'
                      ? 'bg-white/15'
                      : 'bg-primary/70'
              }
              style={{ width: `${status.percent}%` }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {statuses.map((status) => (
          <div
            key={status.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2 text-[#d8e3de]">
              <span
                className={`inline-flex h-2.5 w-2.5  ${
                  status.label === 'Resolved'
                    ? 'bg-emerald-300/85'
                    : status.label === 'Reviewed'
                      ? 'bg-amber-200/80'
                      : status.label === 'Ignored'
                        ? 'bg-white/20'
                        : 'bg-primary/85'
                }`}
              />
              <span>{status.label}</span>
            </div>
            <span className="text-[#8ea39a]">
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
    <div className="flex flex-wrap gap-2.5">
      {keywords.map((keyword) => (
        <div
          key={keyword.label}
          className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-[#d6e1dc]"
        >
          <span>{keyword.label}</span>
          <span className="ml-2 text-[#8ea39a]">{keyword.value}</span>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel({ insights }: Pick<FeedbackAnalyticsSnapshot, 'insights'>) {
  return (
    <article className={PANEL_CLASS}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-on-surface">
          Feedback insights
        </h2>
        <p className="mt-1 text-sm text-[#8ea39a]">
          Interpreted signals that help the team respond quickly without reading every row
          first.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className=" border border-outline-variant/20 bg-white/[0.035] p-4"
          >
            <p className="text-sm font-semibold text-on-surface">{insight.title}</p>
            <p className="mt-2 text-sm leading-6 text-[#8ea39a]">{insight.detail}</p>
          </div>
        ))}
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
          subtitle="Track submission volume over the selected period with restrained trend context."
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
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#8ea39a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8ea39a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ stroke: 'rgba(142, 216, 191, 0.22)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#8ed8bf"
                    strokeWidth={2.5}
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 4,
                      stroke: '#06100f',
                      strokeWidth: 2,
                      fill: '#8ed8bf'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelFrame>

        <PanelFrame
          title="Sentiment distribution"
          subtitle="A quick read on how much of the feedback feels positive, neutral, or negative."
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
                      stroke="rgba(7,16,15,0.9)"
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

            <div className="space-y-3">
              {analytics.sentiments.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-center justify-between gap-3  border border-outline-variant/20 bg-surface-container-low px-3 py-3"
                >
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span
                      className="inline-flex h-2.5 w-2.5 "
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-on-surface">{entry.percent}%</p>
                    <p className="text-xs text-[#8ea39a]">{entry.value} items</p>
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
          subtitle="Understand the shape of user satisfaction without overloading the chart."
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
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#8ea39a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#8ea39a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[10, 10, 0, 0]}
                    fill="#bed7cf"
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </PanelFrame>

        <PanelFrame
          title="Top categories and themes"
          subtitle="See which topics are surfacing most often across the current selection."
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
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: '#8ea39a', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#d6e1dc', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 10, 10, 0]}
                    fill="#97d8c4"
                    maxBarSize={18}
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
          subtitle="Keep an eye on how much feedback is still open versus already resolved."
        >
          <StatusOverview statuses={analytics.statuses} />
        </PanelFrame>
      </section>

      <InsightsPanel insights={analytics.insights} />
    </div>
  );
}
