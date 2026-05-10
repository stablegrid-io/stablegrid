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
import { ADMIN_SECONDARY_SURFACE_CLASS } from '@/components/admin/theme';
import type { FeedbackAnalyticsSnapshot } from '@/components/admin/feedback/types';

const PANEL_CLASS = `${ADMIN_SECONDARY_SURFACE_CLASS} relative overflow-hidden p-6`;

const PRIMARY_STROKE = '#a33800';
const SECONDARY_STROKE = '#1c1c16';
const MUTED_STROKE = '#8d7167';

const tooltipContentStyle = {
  border: '1px solid #1c1c16',
  background: '#fdf9f0',
  color: '#1c1c16',
  padding: '8px 14px',
  fontSize: '13px',
  borderRadius: 0,
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
      <div className="relative">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-h2 text-[18px] font-bold tracking-tight text-on-surface">{title}</h2>
            <p className="mt-1 font-body text-[13px] text-on-surface-variant leading-relaxed">{subtitle}</p>
          </div>
        </div>
        {children}
      </div>
    </article>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-[220px] items-center justify-center border border-dashed border-surface-dim bg-surface-container-low font-data-mono text-[11px] tracking-[0.14em] uppercase text-on-surface-variant">
      {message}
    </div>
  );
}

function StatusOverview({ statuses }: Pick<FeedbackAnalyticsSnapshot, 'statuses'>) {
  const total = statuses.reduce((sum, status) => sum + status.value, 0);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-surface-dim bg-surface-container-low">
        <div className="flex h-2.5 w-full">
          {statuses.map((status) => (
            <div
              key={status.label}
              className={
                status.label === 'Resolved'
                  ? 'bg-primary'
                  : status.label === 'Reviewed'
                    ? 'bg-on-surface'
                    : status.label === 'Ignored'
                      ? 'bg-surface-dim'
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
            className="flex items-center justify-between gap-3 font-body text-[13px]"
          >
            <div className="flex items-center gap-2.5 text-on-surface">
              <span
                className={`inline-flex h-2 w-2 ${
                  status.label === 'Resolved'
                    ? 'bg-primary'
                    : status.label === 'Reviewed'
                      ? 'bg-on-surface'
                      : status.label === 'Ignored'
                        ? 'bg-surface-dim'
                        : 'bg-primary/60'
                }`}
              />
              <span>{status.label}</span>
            </div>
            <span className="font-data-mono text-on-surface-variant tabular-nums">
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
          className="inline-flex items-center gap-2 border border-surface-dim bg-surface-container px-3 py-1.5"
        >
          <span className="font-data-mono text-[11px] tracking-[0.1em] uppercase font-semibold text-on-surface">
            {keyword.label}
          </span>
          <span className="font-data-mono text-[11px] tabular-nums text-on-surface-variant">
            {keyword.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function InsightsPanel({ insights }: Pick<FeedbackAnalyticsSnapshot, 'insights'>) {
  return (
    <article className={PANEL_CLASS}>
      <div className="relative">
        <div className="mb-5">
          <h2 className="font-h2 text-[15px] font-semibold tracking-tight text-on-surface">
            Feedback insights
          </h2>
          <p className="mt-1 font-body text-[12px] text-on-surface-variant">
            Interpreted signals that help the team respond quickly without reading every row
            first.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {insights.map((insight) => (
            <div
              key={insight.title}
              className="border border-surface-dim bg-surface p-4"
            >
              <p className="font-body text-[14px] font-semibold text-on-surface">{insight.title}</p>
              <p className="mt-2 font-body text-[13px] leading-relaxed text-on-surface-variant">
                {insight.detail}
              </p>
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
            <div className="h-[280px] bg-surface-container-low">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.trend}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke={MUTED_STROKE} strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: MUTED_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: MUTED_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ stroke: PRIMARY_STROKE, strokeOpacity: 0.2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={PRIMARY_STROKE}
                    strokeWidth={2.5}
                    dot={{ r: 0 }}
                    activeDot={{
                      r: 4,
                      stroke: SECONDARY_STROKE,
                      strokeWidth: 2,
                      fill: PRIMARY_STROKE
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
              <div className="h-[220px] bg-surface-container-low">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.sentiments}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                      stroke="#fdf9f0"
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
                  className="flex items-center justify-between gap-3 border border-surface-dim bg-surface px-4 py-3"
                >
                  <div className="flex items-center gap-2.5 font-body text-[13px] text-on-surface">
                    <span
                      className="inline-flex h-2 w-2"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.label}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-data-mono text-[13px] font-medium text-on-surface tabular-nums">{entry.percent}%</p>
                    <p className="font-data-mono text-[11px] text-on-surface-variant">{entry.value} items</p>
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
            <div className="h-[240px] bg-surface-container-low">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.ratings}
                  margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
                >
                  <CartesianGrid stroke={MUTED_STROKE} strokeOpacity={0.2} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: MUTED_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: MUTED_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: PRIMARY_STROKE, fillOpacity: 0.05 }}
                  />
                  <Bar
                    dataKey="value"
                    fill={PRIMARY_STROKE}
                    maxBarSize={42}
                    fillOpacity={0.85}
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
            <div className="h-[240px] bg-surface-container-low">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.categories}
                  layout="vertical"
                  margin={{ top: 8, right: 12, left: 26, bottom: 0 }}
                >
                  <CartesianGrid stroke={MUTED_STROKE} strokeOpacity={0.15} horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fill: MUTED_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: SECONDARY_STROKE, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    cursor={{ fill: PRIMARY_STROKE, fillOpacity: 0.05 }}
                  />
                  <Bar
                    dataKey="value"
                    fill={SECONDARY_STROKE}
                    maxBarSize={18}
                    fillOpacity={0.85}
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
