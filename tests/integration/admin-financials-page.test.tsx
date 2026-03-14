import { cloneElement, isValidElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminFinancialsPage } from '@/components/admin/financials/AdminFinancialsPage';
import type { AdminFinancialsSnapshot } from '@/lib/admin/types';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => {
      if (!isValidElement(children)) {
        return null;
      }

      return cloneElement(children, {
        width: 860,
        height: 260
      });
    }
  };
});

const financialsSnapshot: AdminFinancialsSnapshot = {
  generatedAt: '2026-03-14T12:00:00.000Z',
  periodLabel: 'Last 30 days',
  monthlyRevenue: 204,
  previousMonthlyRevenue: 180,
  heroTrend: [
    { bucketStart: '2026-03-03T00:00:00.000Z', label: 'Mar 3', revenue: 12, orders: 1 },
    { bucketStart: '2026-03-04T00:00:00.000Z', label: 'Mar 4', revenue: 0, orders: 0 },
    { bucketStart: '2026-03-05T00:00:00.000Z', label: 'Mar 5', revenue: 24, orders: 2 }
  ],
  dailyRevenue: [
    { bucketStart: '2026-03-12T00:00:00.000Z', label: 'Mar 12', revenue: 24, orders: 2 },
    { bucketStart: '2026-03-13T00:00:00.000Z', label: 'Mar 13', revenue: 0, orders: 0 },
    { bucketStart: '2026-03-14T00:00:00.000Z', label: 'Mar 14', revenue: 12, orders: 1 }
  ],
  kpis: [
    { id: 'total_orders', label: 'Total Orders', value: 17, displayValue: '17', changePct: 13.3 },
    {
      id: 'avg_order_value',
      label: 'Avg Order Value',
      value: 12,
      displayValue: '€12.00',
      changePct: 0
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: 4.2,
      displayValue: '4.2%',
      changePct: 5.1
    },
    { id: 'refund_rate', label: 'Refund Rate', value: 1.2, displayValue: '1.2%', changePct: -7.7 }
  ]
};

describe('AdminFinancialsPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ data: financialsSnapshot })
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the financial overview with live data cards', async () => {
    render(<AdminFinancialsPage />);

    expect(screen.getByRole('heading', { name: 'Revenue & Sales' })).toBeInTheDocument();
    expect(await screen.findByText('Monthly revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    expect(screen.getByText('Refund Rate')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Daily Revenue' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Revenue by Channel' })).not.toBeInTheDocument();
  });
});
