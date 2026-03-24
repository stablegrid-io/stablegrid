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
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
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

const CATEGORY_COLOR: Record<Category, string> = {
  'Hosting':        'text-sky-300/80 bg-sky-400/8 border-sky-400/15',
  'AI / APIs':      'text-violet-300/80 bg-violet-400/8 border-violet-400/15',
  'Subscriptions':  'text-amber-300/80 bg-amber-400/8 border-amber-400/15',
  'Design':         'text-pink-300/80 bg-pink-400/8 border-pink-400/15',
  'Development':    'text-emerald-300/80 bg-emerald-400/8 border-emerald-400/15',
  'Marketing':      'text-orange-300/80 bg-orange-400/8 border-orange-400/15',
  'Miscellaneous':  'text-slate-300/80 bg-slate-400/8 border-slate-400/15'
};

const DOMAIN_COLOR: Record<Domain, string> = {
  'Infrastructure': 'text-cyan-300/80 bg-cyan-400/8 border-cyan-400/15',
  'Product':        'text-indigo-300/80 bg-indigo-400/8 border-indigo-400/15',
  'AI / ML':        'text-purple-300/80 bg-purple-400/8 border-purple-400/15',
  'Marketing':      'text-orange-300/80 bg-orange-400/8 border-orange-400/15',
  'Operations':     'text-teal-300/80 bg-teal-400/8 border-teal-400/15',
  'Content':        'text-lime-300/80 bg-lime-400/8 border-lime-400/15',
  'General':        'text-slate-300/80 bg-slate-400/8 border-slate-400/15'
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

const selectClass =
  'rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[12px] text-on-surface outline-none focus:border-white/[0.15]';
const inputClass =
  'rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[12px] text-on-surface placeholder-on-surface-variant/20 outline-none focus:border-white/[0.15]';

const formInputClass =
  'h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-[13px] font-medium text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/25 focus:border-white/[0.15]';

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
                <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">Spending</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-on-surface sm:text-3xl">
                  Project expenses
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as ChartPeriod)}
                    className="h-8 appearance-none rounded-full border border-white/[0.08] bg-white/[0.04] pl-3 pr-7 text-[12px] font-medium text-on-surface/80 outline-none transition-all cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.12] focus:border-white/[0.18]"
                  >
                    {CHART_PERIOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-on-surface-variant/30">
                    <svg aria-hidden="true" viewBox="0 0 12 8" className="h-[7px] w-[7px] fill-current">
                      <path d="M6 8 0 0h12L6 8Z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void loadEntries()}
                  disabled={loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-on-surface-variant/60 transition-colors hover:bg-white/[0.07] hover:text-on-surface-variant disabled:opacity-40"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.2} />
                </button>
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
                    Total spent
                  </p>
                  <p className="text-xl font-bold tracking-tight text-rose-400">{fmt(totalSpend)}</p>
                </div>
              </div>
            </div>
          </AdminSurface>

          {error && (
            <div className="rounded-lg border border-rose-400/15 bg-rose-400/8 px-4 py-3 text-[13px] text-rose-300/80">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_18rem]">
            {/* Left: form + table */}
            <div className="space-y-5">
              {/* Add entry form */}
              <AdminSurface className="px-6 py-6 sm:px-7">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
                  New entry
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr_1fr]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
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
                    <label className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
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
                    <label className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
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
                    <label className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
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
                    <label className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/40">
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
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/12 px-4 text-[13px] font-medium text-on-surface transition-colors hover:border-primary/50 hover:bg-primary/18 disabled:opacity-40"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>

                {formError && (
                  <p className="mt-2 text-[12px] text-rose-400">{formError}</p>
                )}
              </AdminSurface>

              {/* Entries table */}
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-2xl">
                {loading ? (
                  <div className="px-6 py-12 text-center text-[13px] text-on-surface-variant/30">
                    Loading...
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="px-6 py-12 text-center text-[13px] text-on-surface-variant/30">
                    No entries in the selected period.
                  </div>
                ) : (
                  <table className="w-full border-separate border-spacing-0 text-[13px]">
                    <thead>
                      <tr className="text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/35">
                        <th className="border-b border-white/[0.06] px-5 py-3 text-left">Date</th>
                        <th className="border-b border-white/[0.06] px-4 py-3 text-left">Category</th>
                        <th className="border-b border-white/[0.06] px-4 py-3 text-left">Domain</th>
                        <th className="border-b border-white/[0.06] px-4 py-3 text-left">Description</th>
                        <th className="border-b border-white/[0.06] px-4 py-3 text-right">Amount</th>
                        <th className="border-b border-white/[0.06] px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry) => {
                        const isEditing = editState?.id === entry.id;
                        return (
                          <tr
                            key={entry.id}
                            className={`group transition-colors hover:bg-white/[0.02] ${deletingId === entry.id ? 'opacity-40' : ''}`}
                          >
                            {isEditing ? (
                              <>
                                <td className="border-b border-white/[0.04] px-5 py-2">
                                  <input
                                    type="date"
                                    value={editState.date}
                                    onChange={(e) => setEditState((s) => s && { ...s, date: e.target.value })}
                                    className={inputClass}
                                  />
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-2">
                                  <select
                                    value={editState.category}
                                    onChange={(e) => setEditState((s) => s && { ...s, category: e.target.value as Category })}
                                    className={selectClass}
                                  >
                                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-2">
                                  <select
                                    value={editState.domain}
                                    onChange={(e) => setEditState((s) => s && { ...s, domain: e.target.value as Domain })}
                                    className={selectClass}
                                  >
                                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-2">
                                  <input
                                    type="text"
                                    value={editState.description}
                                    onChange={(e) => setEditState((s) => s && { ...s, description: e.target.value })}
                                    className={`${inputClass} w-full`}
                                  />
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editState.amount}
                                    onChange={(e) => setEditState((s) => s && { ...s, amount: e.target.value })}
                                    className={`${inputClass} w-24 text-right`}
                                  />
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-2">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => void handleSave()}
                                      disabled={savingId === entry.id}
                                      className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-1.5 text-emerald-400/80 transition-colors hover:bg-emerald-400/20 disabled:opacity-40"
                                      aria-label="Save"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-1.5 text-on-surface-variant/50 transition-colors hover:text-on-surface-variant"
                                      aria-label="Cancel"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="whitespace-nowrap border-b border-white/[0.04] px-5 py-3.5 text-on-surface-variant/40">{entry.date}</td>
                                <td className="border-b border-white/[0.04] px-4 py-3.5">
                                  <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLOR[entry.category]}`}>
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-3.5">
                                  <span className={`inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium ${DOMAIN_COLOR[entry.domain ?? 'General']}`}>
                                    {entry.domain ?? 'General'}
                                  </span>
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-3.5 text-on-surface">{entry.description}</td>
                                <td className="whitespace-nowrap border-b border-white/[0.04] px-4 py-3.5 text-right font-mono font-semibold text-rose-400/80">
                                  {fmt(Number(entry.amount))}
                                </td>
                                <td className="border-b border-white/[0.04] px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(entry)}
                                      className="text-on-surface-variant/40 transition-colors hover:text-on-surface-variant"
                                      aria-label="Edit entry"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(entry.id)}
                                      disabled={deletingId === entry.id}
                                      className="text-on-surface-variant/40 transition-colors hover:text-rose-400 disabled:cursor-not-allowed"
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
                      <tr className="border-t border-white/[0.06]">
                        <td colSpan={4} className="px-5 py-3.5 text-[11px] font-medium uppercase tracking-widest text-on-surface-variant/35">
                          Total · {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-base font-bold text-rose-400">
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
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-5 backdrop-blur-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">
                  By category
                </p>
                {byCategory.length === 0 ? (
                  <p className="mt-4 text-[13px] text-on-surface-variant/30">No data yet.</p>
                ) : (
                  <div className="mt-4 space-y-3.5">
                    {byCategory.map(({ cat, total }) => {
                      const pct = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[cat]}`}>
                              {cat}
                            </span>
                            <span className="font-mono text-[12px] font-semibold text-on-surface">
                              {fmt(total)}
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                            <div
                              className="h-full rounded-full bg-rose-400/50 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
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
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,100,100,0.02),transparent_60%)] pointer-events-none" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant/50">Daily spend</p>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-on-surface">Spending over time</h2>
              <p className="mt-1 text-[12px] text-on-surface-variant/35">Daily aggregated expenses across all categories.</p>

              {dailySpendData.length === 0 ? (
                <div className="mt-5 flex h-[200px] items-center justify-center rounded-xl border border-dashed border-white/[0.06] bg-white/[0.02] text-[13px] text-on-surface-variant/30">
                  Chart will appear once entries are added.
                </div>
              ) : (
                <div className="mt-5 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailySpendData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={50}
                        tickFormatter={(v: number) => `€${v}`}
                      />
                      <Tooltip
                        contentStyle={tooltipContentStyle}
                        cursor={{ stroke: 'rgba(251,113,133,0.15)' }}
                        formatter={(value: number) => [fmt(value), 'Spent']}
                      />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#fb7185"
                        strokeWidth={2.5}
                        dot={{ r: 0 }}
                        activeDot={{
                          r: 4,
                          stroke: '#0c0e10',
                          strokeWidth: 2,
                          fill: '#fb7185'
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
