import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  formatKwh,
  formatPercent,
  formatProgressFraction,
  formatRelativeTime,
  isCustomerOnline,
  progressPercentValue,
  sortCustomers
} from '@/components/admin/customers/utils';
import type { Customer } from '@/components/admin/customers/types';

const buildCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'user-id',
  fullName: 'Test User',
  email: 'test@example.com',
  status: 'Active',
  joinedAt: '2026-01-01T00:00:00.000Z',
  orders: 0,
  totalSpent: 0,
  initials: 'TU',
  theoryModulesCompleted: 0,
  theoryModulesTotal: 30,
  lessonsCompleted: 0,
  lessonsTotal: 300,
  practiceTasksSolved: 0,
  practiceTasksTotal: 180,
  kwhTotal: 0,
  lastActiveAt: null,
  ...overrides
});

describe('formatPercent', () => {
  it('rounds to integer percent', () => {
    expect(formatPercent(8, 30)).toBe('27%');
    expect(formatPercent(1, 3)).toBe('33%');
    expect(formatPercent(30, 30)).toBe('100%');
  });

  it('returns em-dash when total is zero or negative', () => {
    expect(formatPercent(0, 0)).toBe('—');
    expect(formatPercent(5, -1)).toBe('—');
  });

  it('clamps to [0, 100]', () => {
    expect(formatPercent(35, 30)).toBe('100%');
  });
});

describe('formatProgressFraction', () => {
  it('renders "X / Y" for a real denominator', () => {
    expect(formatProgressFraction(8, 30)).toBe('8 / 30');
  });

  it('em-dashes when the denominator is zero', () => {
    expect(formatProgressFraction(0, 0)).toBe('—');
  });
});

describe('progressPercentValue', () => {
  it('returns a numeric percent in [0, 100]', () => {
    expect(progressPercentValue(15, 30)).toBe(50);
    expect(progressPercentValue(0, 30)).toBe(0);
    expect(progressPercentValue(30, 30)).toBe(100);
  });

  it('returns 0 when total is zero (no division by zero)', () => {
    expect(progressPercentValue(5, 0)).toBe(0);
  });
});

describe('formatKwh', () => {
  it('thousands-separates and appends unit', () => {
    expect(formatKwh(0)).toBe('0 kWh');
    expect(formatKwh(1250)).toMatch(/1[,. ]250 kWh/);
  });
});

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-05-14T12:00:00.000Z').getTime();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns "just now" when the gap rounds to under a minute', () => {
    const iso = new Date(NOW - 5_000).toISOString(); // 5s ago
    expect(formatRelativeTime(iso)).toBe('just now');
  });

  it('uses minute granularity under an hour', () => {
    const iso = new Date(NOW - 15 * 60_000).toISOString(); // 15m ago
    expect(formatRelativeTime(iso)).toBe('15m ago');
  });

  it('uses hour granularity under a day', () => {
    const iso = new Date(NOW - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('3h ago');
  });

  it('uses day granularity under a month', () => {
    const iso = new Date(NOW - 5 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('5d ago');
  });

  it('uses month granularity beyond 30 days', () => {
    const iso = new Date(NOW - 60 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe('2mo ago');
  });

  it('em-dashes for null / invalid / future timestamps', () => {
    expect(formatRelativeTime(null)).toBe('—');
    expect(formatRelativeTime('not-a-date')).toBe('—');
    expect(formatRelativeTime(new Date(NOW + 60_000).toISOString())).toBe('—');
  });
});

describe('sortCustomers — new progress columns', () => {
  const a = buildCustomer({
    id: 'a',
    theoryModulesCompleted: 5,
    practiceTasksSolved: 20,
    kwhTotal: 1000,
    lastActiveAt: '2026-05-14T10:00:00.000Z'
  });
  const b = buildCustomer({
    id: 'b',
    theoryModulesCompleted: 15,
    practiceTasksSolved: 5,
    kwhTotal: 500,
    lastActiveAt: '2026-05-14T11:00:00.000Z'
  });
  const c = buildCustomer({
    id: 'c',
    theoryModulesCompleted: 0,
    practiceTasksSolved: 0,
    kwhTotal: 0,
    lastActiveAt: null
  });

  it('sorts by theory progress ratio descending', () => {
    const sorted = sortCustomers([a, b, c], { key: 'theoryProgress', direction: 'desc' });
    expect(sorted.map((row) => row.id)).toEqual(['b', 'a', 'c']);
  });

  it('sorts by practice progress ratio ascending', () => {
    const sorted = sortCustomers([a, b, c], { key: 'practiceProgress', direction: 'asc' });
    // c has 0 ratio, b has lower ratio than a
    expect(sorted[0].id).toBe('c');
    expect(sorted[sorted.length - 1].id).toBe('a');
  });

  it('sorts by kWh descending', () => {
    const sorted = sortCustomers([a, b, c], { key: 'kwh', direction: 'desc' });
    expect(sorted.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by last active descending, nulls last', () => {
    const sorted = sortCustomers([a, b, c], { key: 'lastActive', direction: 'desc' });
    expect(sorted[0].id).toBe('b'); // most recent
    expect(sorted[sorted.length - 1].id).toBe('c'); // null sinks
  });

  it('sorts by lessons descending', () => {
    const aLow = buildCustomer({ id: 'low', lessonsCompleted: 5, lessonsTotal: 300 });
    const aMid = buildCustomer({ id: 'mid', lessonsCompleted: 60, lessonsTotal: 300 });
    const aHigh = buildCustomer({ id: 'high', lessonsCompleted: 240, lessonsTotal: 300 });
    const sorted = sortCustomers([aLow, aMid, aHigh], { key: 'lessons', direction: 'desc' });
    expect(sorted.map((row) => row.id)).toEqual(['high', 'mid', 'low']);
  });
});

describe('isCustomerOnline', () => {
  const NOW = new Date('2026-05-14T12:00:00.000Z').getTime();

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it('returns true within the 5-minute window', () => {
    expect(isCustomerOnline(new Date(NOW - 2 * 60_000).toISOString())).toBe(true);
    expect(isCustomerOnline(new Date(NOW - 30_000).toISOString())).toBe(true);
  });

  it('returns false past the 5-minute window', () => {
    expect(isCustomerOnline(new Date(NOW - 6 * 60_000).toISOString())).toBe(false);
    expect(isCustomerOnline(new Date(NOW - 60 * 60_000).toISOString())).toBe(false);
  });

  it('returns false for null / invalid', () => {
    expect(isCustomerOnline(null)).toBe(false);
    expect(isCustomerOnline('not-a-date')).toBe(false);
  });
});
