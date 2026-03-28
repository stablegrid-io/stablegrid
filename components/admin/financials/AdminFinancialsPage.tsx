'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import dynamic from 'next/dynamic';
import { FinancialsKpiCard } from '@/components/admin/financials/FinancialsKpiCard';
import { FinancialsPageHeader } from '@/components/admin/financials/FinancialsPageHeader';

const RevenueHeroCard = dynamic(
  () => import('@/components/admin/financials/RevenueHeroCard').then((m) => m.RevenueHeroCard),
  { ssr: false, loading: () => <div className="h-40 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" /> }
);
const DailyRevenueChartCard = dynamic(
  () => import('@/components/admin/financials/DailyRevenueChartCard').then((m) => m.DailyRevenueChartCard),
  { ssr: false, loading: () => <div className="h-64 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" /> }
);
import {
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
  AdminInlineMessage
} from '@/components/admin/theme';
import type { AdminFinancialsSnapshot } from '@/lib/admin/types';

interface ApiEnvelope<T> {
  data: T;
  error?: string;
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
  });

  const payload = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload.data;
}

export function AdminFinancialsPage() {
  const [snapshot, setSnapshot] = useState<AdminFinancialsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFinancials = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestJson<AdminFinancialsSnapshot>('/api/admin/financials');
      setSnapshot(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load financials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinancials();
  }, [loadFinancials]);

  return (
    <main className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="financials" />
        </aside>

        <div className="space-y-5">
          <FinancialsPageHeader />

          {error ? <AdminInlineMessage tone="error" message={error} /> : null}

          {loading && !snapshot ? (
            <section className={`${ADMIN_SECONDARY_SURFACE_CLASS} px-5 py-10 text-sm text-[#90a49b]`}>
              Loading financials...
            </section>
          ) : null}

          {snapshot ? (
            <>
              <RevenueHeroCard
                monthlyRevenue={snapshot.monthlyRevenue}
                previousMonthlyRevenue={snapshot.previousMonthlyRevenue}
                trend={snapshot.heroTrend}
              />

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {snapshot.kpis.map((metric) => (
                  <FinancialsKpiCard key={metric.id} metric={metric} />
                ))}
              </section>

              <section className="grid gap-4">
                <DailyRevenueChartCard points={snapshot.dailyRevenue} />
              </section>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
