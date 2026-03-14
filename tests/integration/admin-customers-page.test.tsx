import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminCustomersPage } from '@/components/admin/customers/AdminCustomersPage';
import type { Customer } from '@/components/admin/customers/types';

const CUSTOMER_FIXTURE: Customer[] = [
  {
    id: 'user-1',
    fullName: 'Emma Wilson',
    email: 'emma@stablegrid.io',
    status: 'Active',
    joinedAt: '2026-01-05T09:15:00.000Z',
    orders: 2,
    totalSpent: 24,
    initials: 'EW'
  },
  {
    id: 'user-2',
    fullName: 'David Kim',
    email: 'david@stablegrid.io',
    status: 'Inactive',
    joinedAt: '2026-01-12T10:03:00.000Z',
    orders: 0,
    totalSpent: 0,
    initials: 'DK'
  },
  {
    id: 'user-3',
    fullName: 'Nina Patel',
    email: 'nina@stablegrid.io',
    status: 'Active',
    joinedAt: '2026-01-20T11:22:00.000Z',
    orders: 1,
    totalSpent: 12,
    initials: 'NP'
  }
];

const flushTimers = async (ms = 600) => {
  await act(async () => {
    await Promise.resolve();
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
};

describe('AdminCustomersPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: CUSTOMER_FIXTURE })
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  it('combines status filter and search with pagination summary', async () => {
    render(<AdminCustomersPage />);
    await flushTimers();

    const searchInput = screen.getByPlaceholderText('Search customers...');
    fireEvent.change(searchInput, { target: { value: 'david' } });
    await flushTimers(180);

    fireEvent.click(screen.getByRole('tab', { name: 'Inactive' }));
    await flushTimers(180);

    expect(screen.getByText('David Kim')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-1 of 1 results')).toBeInTheDocument();
  });

  it('supports column toggles and opens the customer drawer on row click', async () => {
    render(<AdminCustomersPage />);
    await flushTimers();

    fireEvent.click(screen.getByRole('button', { name: 'Columns' }));
    const menu = screen.getByText('Visible columns').closest('div');
    expect(menu).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Orders column' }));
    await flushTimers(180);

    const table = screen.getByRole('table');
    expect(within(table).queryByRole('button', { name: /Orders/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Emma Wilson'));
    expect(screen.getByRole('dialog', { name: 'Customer detail' })).toBeInTheDocument();
    expect(screen.getByText('Detail actions placeholder. Connect this drawer to real customer profile, billing, and activity timeline APIs.')).toBeInTheDocument();
  });
});
