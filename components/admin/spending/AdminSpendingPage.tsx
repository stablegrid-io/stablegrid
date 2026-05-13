'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Trash2, PlusCircle, RefreshCw, Pencil, Check, X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import {
  ADMIN_EYEBROW_CLASS,
  ADMIN_FIELD_LABEL_CLASS,
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_SURFACE_CLASS,
  ADMIN_TABLE_SURFACE_CLASS,
  AdminSurface
} from '@/components/admin/theme';

const CATEGORIES = [
  'Hosting',
  'AI / APIs',
  'Subscriptions',
  'Design',
  'Development',
  'Marketing',
  'Miscellaneous'
] as const;

const DOMAINS = [
  'Infrastructure',
  'Product',
  'AI / ML',
  'Marketing',
  'Operations',
  'Content',
  'General'
] as const;

type Category = (typeof CATEGORIES)[number];
type Domain = (typeof DOMAINS)[number];

interface SpendingEntry {
  id: string;
  date: string;
  category: Category;
  domain: Domain;
  amount: number;
  description: string;
  created_at: string;
}

const TAG_NEUTRAL = 'border-surface-dim bg-surface-container text-on-surface-variant';
const TAG_ACCENT = 'border-primary/40 bg-primary/10 text-primary';

const CATEGORY_COLOR: Record<Category, string> = {
  'Hosting':        TAG_ACCENT,
  'AI / APIs':      TAG_ACCENT,
  'Subscriptions':  TAG_NEUTRAL,
  'Design':         TAG_NEUTRAL,
  'Development':    TAG_ACCENT,
  'Marketing':      TAG_NEUTRAL,
  'Miscellaneous':  TAG_NEUTRAL
};

const DOMAIN_COLOR: Record<Domain, string> = {
  'Infrastructure': TAG_ACCENT,
  'Product':        TAG_ACCENT,
  'AI / ML':        TAG_ACCENT,
  'Marketing':      TAG_NEUTRAL,
  'Operations':     TAG_NEUTRAL,
  'Content':        TAG_NEUTRAL,
  'General':        TAG_NEUTRAL
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(n);

const today = () => new Date().toISOString().slice(0, 10);

interface EditState {
  id: string;
  date: string;
  category: Category;
  domain: Domain;
  amount: string;
  description: string;
}

const PRIMARY = '#e25a1c';
const INK = '#e6e2d9';
const SURFACE = '#14140f';
const GRID = '#36352f';
const AXIS = '#a88a80';

const tooltipContentStyle = {
  border: `1px solid ${INK}`,
  background: SURFACE,
  color: INK,
  padding: '8px 14px',
  fontSize: '13px'
};

const selectClass =
  'border border-surface-dim bg-surface-container-low px-2 py-1 font-data-mono text-[12px] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';
const inputClass =
  'border border-surface-dim bg-surface-container-low px-2 py-1 font-data-mono text-[12px] text-on-surface placeholder-on-surface-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

const formInputClass =
  'h-9 w-full border border-surface-dim bg-surface-container-low px-3 font-body text-[13px] font-medium text-on-surface outline-none transition-colors placeholder:text-on-surface-variant focus:border-primary focus:bg-surface focus:ring-2 focus:ring-primary/30';

type ChartPeriod = '7d' | '30d' | '90d' | 'all';

const CHART_PERIOD_OPTIONS: Array<{ value: ChartPeriod; label: string }> = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' }
];

function getChartStartDate(period: ChartPeriod): Date | null {
  if (period === 'all') return null;
  const now = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
  const days = period === '7d' ? 6 : period === '30d' ? 29 : 89;
  now.setDate(now.getDate() - days);
  return now;
}

function buildDailySpendData(entries: SpendingEntry[], period: ChartPeriod) {
  if (entries.length === 0) return [];
  const byDate = new Map<string, number>();
  for (const entry of entries) {
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + Number(entry.amount));
  }
  const todayDate = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
  const periodStart = getChartStartDate(period);
  const dates = Array.from(byDate.keys()).sort();
  const earliestEntry = new Date(dates[0] + 'T00:00:00');
  const minDate = periodStart && periodStart > earliestEntry ? periodStart : earliestEntry;
  const lastEntry = new Date(dates[dates.length - 1] + 'T00:00:00');
  const maxDate = lastEntry > todayDate ? lastEntry : todayDate;
  const result: Array<{ date: string; amount: number }> = [];
  const cursor = new Date(minDate);
  const fmtDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
  while (cursor <= maxDate) {
    const key = cursor.toISOString().slice(0, 10);
    result.push({
      date: fmtDate.format(cursor),
      amount: Math.round((byDate.get(key) ?? 0) * 100) / 100
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}


export function AdminSpendingPage() {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<Category>('Hosting');
  const [domain, setDomain] = useState<Domain>('General');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<ChartPeriod>('all');
  const descRef = useRef<HTMLInputElement>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/spending', { credentials: 'include' });
      const payload = (await res.json()) as { data?: SpendingEntry[]; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Failed to load entries.');
      setEntries(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const handleAdd = async () => {
    setFormError(null);
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Enter a valid amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setFormError('Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/spending', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, category, domain, amount: parsedAmount, description })
      });
      const payload = (await res.json()) as { data?: SpendingEntry; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Failed to create entry.');
      setEntries((prev) => [payload.data!, ...prev]);
      setAmount('');
      setDescription('');
      descRef.current?.focus();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/spending/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to delete entry.');
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (entry: SpendingEntry) => {
    setEditState({
      id: entry.id,
      date: entry.date,
      category: entry.category,
      domain: entry.domain ?? 'General',
      amount: String(entry.amount),
      description: entry.description
    });
  };

  const cancelEdit = () => setEditState(null);

  const handleSave = async () => {
    if (!editState) return;
    setSavingId(editState.id);
    try {
      const parsedAmount = parseFloat(editState.amount.replace(',', '.'));
      const res = await fetch(`/api/admin/spending/${editState.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editState.date,
          category: editState.category,
          domain: editState.domain,
          amount: parsedAmount,
          description: editState.description
        })
      });
      const payload = (await res.json()) as { data?: SpendingEntry; error?: string };
      if (!res.ok) throw new Error(payload.error ?? 'Failed to update entry.');
      setEntries((prev) => prev.map((e) => (e.id === editState.id ? payload.data! : e)));
      setEditState(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry.');
    } finally {
      setSavingId(null);
    }
  };

  const filteredEntries = useMemo(() => {
    const start = getChartStartDate(period);
    if (!start) return entries;
    const startStr = start.toISOString().slice(0, 10);
    return entries.filter((e) => e.date >= startStr);
  }, [entries, period]);

  const totalSpend = filteredEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    total: filteredEntries.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
  }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const dailySpendData = useMemo(() => buildDailySpendData(entries, period), [entries, period]);

  return (
    <div className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <AdminLeftRail activeSection="spending" />

        <div className="space-y-5">
          {/* Header */}
          <AdminSurface className="px-6 py-6 sm:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className={ADMIN_EYEBROW_CLASS}>Spending</p>
                <h1 className="mt-2 font-h2 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
                  Project expenses
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as ChartPeriod)}
                    className="h-8 appearance-none border border-surface-dim bg-surface pl-3 pr-7 font-data-mono text-[12px] font-medium text-on-surface outline-none transition-colors cursor-pointer hover:bg-surface-container focus:border-primary focus:ring-2 focus:ring-primary/30"
                  >
                    {CHART_PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant">
                    <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                      <path d="M6 8 0 0h12L6 8Z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadEntries()}
                  disabled={loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-surface-dim bg-surface text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:opacity-40"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.2} />
                </button>
                <div className="text-right">
                  <p className={ADMIN_FIELD_LABEL_CLASS}>
                    Total spent
                  </p>
                  <p className="font-data-mono text-xl font-bold tabular-nums tracking-tight text-error">{fmt(totalSpend)}</p>
                </div>
              </div>
            </div>
          </AdminSurface>

          {error && (
            <div className="border border-error/40 bg-error/10 px-4 py-3 font-body text-[13px] text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
            {/* Left: form + table */}
            <div className="space-y-5">
              {/* Add entry form */}
              <AdminSurface className="px-6 py-6 sm:px-7">
                <p className={ADMIN_EYEBROW_CLASS}>
                  New entry
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr_1fr]">
                  <div className="flex flex-col gap-1.5">
                    <label className={ADMIN_FIELD_LABEL_CLASS}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={formInputClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={ADMIN_FIELD_LABEL_CLASS}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className={`${formInputClass} appearance-none cursor-pointer`}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={ADMIN_FIELD_LABEL_CLASS}>
                      Domain
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value as Domain)}
                      className={`${formInputClass} appearance-none cursor-pointer`}
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={ADMIN_FIELD_LABEL_CLASS}>
                      Amount (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
                      className={formInputClass}
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-3">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <label className={ADMIN_FIELD_LABEL_CLASS}>
                      Description
                    </label>
                    <input
                      ref={descRef}
                      type="text"
                      placeholder="e.g. Vercel Pro plan, Claude API, Figma..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
                      className={formInputClass}
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => void handleAdd()}
                      disabled={submitting}
                      className={`${ADMIN_PRIMARY_BUTTON_CLASS} h-9 inline-flex items-center gap-2 px-4 font-data-mono text-[13px] font-medium`}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>

                {formError && (
                  <p className="mt-2 font-body text-[12px] text-error">{formError}</p>
                )}
              </AdminSurface>

              {/* Entries table */}
              <div className={`overflow-hidden ${ADMIN_TABLE_SURFACE_CLASS}`}>
                {loading ? (
                  <div className="px-6 py-12 text-center font-body text-[13px] text-on-surface-variant">
                    Loading...
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="px-6 py-12 text-center font-body text-[13px] text-on-surface-variant">
                    No entries in the selected period.
                  </div>
                ) : (
                  <table className="w-full border-separate border-spacing-0 text-[13px]">
                    <thead>
                      <tr className="font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant">
                        <th className="border-b border-surface-dim px-5 py-3 text-left">Date</th>
                        <th className="border-b border-surface-dim px-4 py-3 text-left">Category</th>
                        <th className="border-b border-surface-dim px-4 py-3 text-left">Domain</th>
                        <th className="border-b border-surface-dim px-4 py-3 text-left">Description</th>
                        <th className="border-b border-surface-dim px-4 py-3 text-right">Amount</th>
                        <th className="border-b border-surface-dim px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => {
                        const isEditing = editState?.id === entry.id;
                        return (
                          <tr
                            key={entry.id}
                            className={`group transition-colors hover:bg-surface-container-low ${deletingId === entry.id ? 'opacity-40' : ''}`}
                          >
                            {isEditing ? (
                              <>
                                <td className="border-b border-surface-dim px-5 py-2">
                                  <input
                                    type="date"
                                    value={editState.date}
                                    onChange={(e) => setEditState((s) => s && { ...s, date: e.target.value })}
                                    className={inputClass}
                                  />
                                </td>
                                <td className="border-b border-surface-dim px-4 py-2">
                                  <select
                                    value={editState.category}
                                    onChange={(e) => setEditState((s) => s && { ...s, category: e.target.value as Category })}
                                    className={selectClass}
                                  >
                                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                </td>
                                <td className="border-b border-surface-dim px-4 py-2">
                                  <select
                                    value={editState.domain}
                                    onChange={(e) => setEditState((s) => s && { ...s, domain: e.target.value as Domain })}
                                    className={selectClass}
                                  >
                                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </td>
                                <td className="border-b border-surface-dim px-4 py-2">
                                  <input
                                    type="text"
                                    value={editState.description}
                                    onChange={(e) => setEditState((s) => s && { ...s, description: e.target.value })}
                                    className={`${inputClass} w-full`}
                                  />
                                </td>
                                <td className="border-b border-surface-dim px-4 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editState.amount}
                                    onChange={(e) => setEditState((s) => s && { ...s, amount: e.target.value })}
                                    className={`${inputClass} w-24 text-right`}
                                  />
                                </td>
                                <td className="border-b border-surface-dim px-4 py-2">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => void handleSave()}
                                      disabled={savingId === entry.id}
                                      className="border border-primary bg-primary/10 p-1.5 text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
                                      aria-label="Save"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="border border-surface-dim bg-surface p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                                      aria-label="Cancel"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="whitespace-nowrap border-b border-surface-dim px-5 py-3.5 font-data-mono tabular-nums text-on-surface-variant">{entry.date}</td>
                                <td className="border-b border-surface-dim px-4 py-3.5">
                                  <span className={`inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${CATEGORY_COLOR[entry.category]}`}>
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="border-b border-surface-dim px-4 py-3.5">
                                  <span className={`inline-flex h-6 items-center border px-2.5 font-data-mono text-[10px] font-semibold tracking-[0.12em] uppercase ${DOMAIN_COLOR[entry.domain ?? 'General']}`}>
                                    {entry.domain ?? 'General'}
                                  </span>
                                </td>
                                <td className="border-b border-surface-dim px-4 py-3.5 font-body text-on-surface">{entry.description}</td>
                                <td className="whitespace-nowrap border-b border-surface-dim px-4 py-3.5 text-right font-data-mono font-bold tabular-nums text-error">
                                  {fmt(Number(entry.amount))}
                                </td>
                                <td className="border-b border-surface-dim px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(entry)}
                                      className="text-on-surface-variant transition-colors hover:text-on-surface"
                                      aria-label="Edit entry"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(entry.id)}
                                      disabled={deletingId === entry.id}
                                      className="text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed"
                                      aria-label="Delete entry"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-surface-dim">
                        <td colSpan={4} className="px-5 py-3.5 font-data-mono text-[10px] font-semibold tracking-[0.16em] uppercase text-on-surface-variant">
                          Total · {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-data-mono text-base font-bold tabular-nums text-error">
                          {fmt(totalSpend)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>

            {/* Right: breakdown by category */}
            <div className="space-y-4">
              <div className={`p-6 ${ADMIN_SECONDARY_SURFACE_CLASS}`}>
                <p className={ADMIN_EYEBROW_CLASS}>
                  By category
                </p>
                {byCategory.length === 0 ? (
                  <p className="mt-4 font-body text-[13px] text-on-surface-variant">No data yet.</p>
                ) : (
                  <div className="mt-4 space-y-3.5">
                    {byCategory.map(({ cat, total }) => {
                      const pct = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className={`inline-flex h-5 items-center border px-2 font-data-mono text-[9px] font-semibold tracking-[0.12em] uppercase ${CATEGORY_COLOR[cat]}`}>
                              {cat}
                            </span>
                            <span className="font-data-mono text-[12px] font-semibold tabular-nums text-on-surface">
                              {fmt(total)}
                            </span>
                          </div>
                          <div className="w-full overflow-hidden bg-surface-container" style={{ height: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: PRIMARY, transition: 'width 1.5s cubic-bezier(.16,1,.3,1)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Spending over time chart */}
          <AdminSurface className="px-6 py-6 sm:px-7">
            <div className="relative">
              <p className={ADMIN_EYEBROW_CLASS}>Daily spend</p>
              <h2 className="mt-1 font-h2 text-[15px] font-semibold tracking-tight text-on-surface">Spending over time</h2>
              <p className="mt-1 font-body text-[12px] text-on-surface-variant">Daily aggregated expenses across all categories.</p>

              {dailySpendData.length === 0 ? (
                <div className="mt-5 flex h-[200px] items-center justify-center border border-dashed border-surface-dim bg-surface-container-low font-data-mono text-[11px] tracking-[0.14em] uppercase text-on-surface-variant">
                  Chart will appear once entries are added.
                </div>
              ) : (
                <div className="mt-5 h-[260px] bg-surface-container-low p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySpendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: AXIS, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: AXIS, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                        tickFormatter={(v: number) => `€${v}`}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        cursor={{ stroke: AXIS }}
                        formatter={(value) => [fmt(Number(value ?? 0)), 'Spent']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke={PRIMARY}
                        strokeWidth={2.5}
                        dot={{ r: 0 }}
                        activeDot={{
                          r: 4,
                          stroke: SURFACE,
                          strokeWidth: 2,
                          fill: PRIMARY
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </AdminSurface>
        </div>
      </div>
    </div>
  );
}
