'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import { DailyRevenueChartCard } from '@/components/admin/financials/DailyRevenueChartCard';
import { FinancialsKpiCard } from '@/components/admin/financials/FinancialsKpiCard';
import { FinancialsPageHeader } from '@/components/admin/financials/FinancialsPageHeader';
import { RevenueHeroCard } from '@/components/admin/financials/RevenueHeroCard';
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
    <main className="min-h-screen bg-[#050908] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1460px] lg:mx-0 lg:grid lg:grid-cols-[13.25rem_minmax(0,1fr)] lg:gap-3 xl:grid-cols-[13.75rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <AdminLeftRail activeSection="financials" />
        </aside>

        <div className="space-y-5">
          <FinancialsPageHeader />

          {error ? (
            <section className="rounded-[18px] border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </section>
          ) : null}

          {loading && !snapshot ? (
            <section className="rounded-[24px] border border-white/10 bg-[#060b0a] px-5 py-10 text-sm text-[#90a49b]">
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
