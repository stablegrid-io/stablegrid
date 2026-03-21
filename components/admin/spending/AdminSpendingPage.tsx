'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2, PlusCircle, TrendingDown, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { AdminLeftRail } from '@/components/admin/AdminLeftRail';
import {
  ADMIN_LAYOUT_CLASS,
  ADMIN_PAGE_SHELL_CLASS,
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

const CATEGORY_COLOR: Record<Category, string> = {
  'Hosting':        'text-sky-400 bg-sky-500/10 border-sky-500/20',
  'AI / APIs':      'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Subscriptions':  'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Design':         'text-pink-400 bg-pink-500/10 border-pink-500/20',
  'Development':    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Marketing':      'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Miscellaneous':  'text-slate-400 bg-slate-500/10 border-slate-500/20'
};

const DOMAIN_COLOR: Record<Domain, string> = {
  'Infrastructure': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Product':        'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'AI / ML':        'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Marketing':      'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Operations':     'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'Content':        'text-lime-400 bg-lime-500/10 border-lime-500/20',
  'General':        'text-slate-400 bg-slate-500/10 border-slate-500/20'
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


export function AdminSpendingPage() {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
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

  const totalSpend = entries.reduce((sum, e) => sum + Number(e.amount), 0);

  const byCategory = CATEGORIES.map((cat) => ({
    cat,
    total: entries.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
  }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const selectClass =
    ' border border-outline-variant/20 bg-surface-container-low px-2 py-1 text-xs text-on-surface focus:border-brand-400/40 focus:outline-none';
  const inputClass =
    ' border border-outline-variant/20 bg-surface-container-low px-2 py-1 text-xs text-on-surface placeholder-white/20 focus:border-brand-400/40 focus:outline-none';

  return (
    <div className={ADMIN_PAGE_SHELL_CLASS}>
      <div className={ADMIN_LAYOUT_CLASS}>
        <AdminLeftRail activeSection="spending" />

        <div className="space-y-4">
          {/* Header */}
          <AdminSurface className="px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center  bg-error/10 text-error">
                <TrendingDown className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.28em] text-primary">
                  Admin · Dev Tools
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-on-surface">
                  Project Spending
                </h1>
              </div>
              <div className="ml-auto flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => void loadEntries()}
                  disabled={loading}
                  className="flex items-center gap-1.5  border border-outline-variant/20 bg-surface-container-low px-3 py-1.5 text-xs text-on-surface-variant transition hover:border-white/20 hover:text-on-surface disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <div className="text-right">
                  <p className="text-[0.64rem] uppercase tracking-[0.22em] text-on-surface-variant">
                    Total spent
                  </p>
                  <p className="text-xl font-bold text-error">{fmt(totalSpend)}</p>
                </div>
              </div>
            </div>
          </AdminSurface>

          {error && (
            <div className=" border border-error/25 bg-error/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
            {/* Left: form + table */}
            <div className="space-y-4">
              {/* Add entry form */}
              <AdminSurface className="px-6 py-5">
                <p className="mb-4 text-[0.64rem] uppercase tracking-[0.28em] text-primary">
                  New entry
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr_1fr_1fr]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-brand-400/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-brand-400/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Domain
                    </label>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value as Domain)}
                      className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-brand-400/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
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
                      className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder-white/20 focus:border-brand-400/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="mt-3 flex gap-3">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                      Description
                    </label>
                    <input
                      ref={descRef}
                      type="text"
                      placeholder="e.g. Vercel Pro plan, Claude API, Figma..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && void handleAdd()}
                      className=" border border-outline-variant/20 bg-surface-container-low px-3 py-2 text-sm text-on-surface placeholder-white/20 focus:border-brand-400/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() => void handleAdd()}
                      disabled={submitting}
                      className="inline-flex items-center gap-2  border border-primary/30 bg-primary/12 px-4 py-2 text-sm font-medium text-primary transition hover:border-brand-400/50 hover:bg-primary/20 disabled:opacity-50"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {submitting ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>

                {formError && (
                  <p className="mt-2 text-xs text-error">{formError}</p>
                )}
              </AdminSurface>

              {/* Entries table */}
              <div className={ADMIN_TABLE_SURFACE_CLASS}>
                {loading ? (
                  <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    Loading...
                  </div>
                ) : entries.length === 0 ? (
                  <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
                    No entries yet. Add your first expense above.
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-outline-variant/15">
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">Date</th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">Category</th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">Domain</th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">Description</th>
                        <th className="px-4 py-3 text-right text-[10px] font-medium uppercase tracking-[0.18em] text-on-surface-variant">Amount</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entries.map((entry) => {
                        const isEditing = editState?.id === entry.id;
                        return (
                          <tr
                            key={entry.id}
                            className={`group transition hover:bg-white/[0.02] ${deletingId === entry.id ? 'opacity-40' : ''}`}
                          >
                            {isEditing ? (
                              <>
                                <td className="px-4 py-2">
                                  <input
                                    type="date"
                                    value={editState.date}
                                    onChange={(e) => setEditState((s) => s && { ...s, date: e.target.value })}
                                    className={inputClass}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={editState.category}
                                    onChange={(e) => setEditState((s) => s && { ...s, category: e.target.value as Category })}
                                    className={selectClass}
                                  >
                                    {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={editState.domain}
                                    onChange={(e) => setEditState((s) => s && { ...s, domain: e.target.value as Domain })}
                                    className={selectClass}
                                  >
                                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={editState.description}
                                    onChange={(e) => setEditState((s) => s && { ...s, description: e.target.value })}
                                    className={`${inputClass} w-full`}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editState.amount}
                                    onChange={(e) => setEditState((s) => s && { ...s, amount: e.target.value })}
                                    className={`${inputClass} w-24 text-right`}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => void handleSave()}
                                      disabled={savingId === entry.id}
                                      className="rounded-[8px] border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
                                      aria-label="Save"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="rounded-[8px] border border-outline-variant/20 bg-surface-container-low p-1.5 text-on-surface-variant transition hover:text-on-surface"
                                      aria-label="Cancel"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">{entry.date}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block  border px-2.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[entry.category]}`}>
                                    {entry.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-block  border px-2.5 py-0.5 text-[10px] font-medium ${DOMAIN_COLOR[entry.domain ?? 'General']}`}>
                                    {entry.domain ?? 'General'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-on-surface">{entry.description}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-semibold text-error">
                                  {fmt(Number(entry.amount))}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 transition group-hover:opacity-100">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(entry)}
                                      className="text-on-surface-variant transition hover:text-on-surface"
                                      aria-label="Edit entry"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => void handleDelete(entry.id)}
                                      disabled={deletingId === entry.id}
                                      className="text-on-surface-variant transition hover:text-error disabled:cursor-not-allowed"
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
                      <tr className="border-t border-outline-variant/20">
                        <td colSpan={4} className="px-4 py-3 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                          Total · {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-base font-bold text-error">
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
            <div className="space-y-3">
              <div className={`${ADMIN_SECONDARY_SURFACE_CLASS} px-5 py-4`}>
                <p className="mb-4 text-[0.64rem] uppercase tracking-[0.28em] text-primary">
                  By category
                </p>
                {byCategory.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {byCategory.map(({ cat, total }) => {
                      const pct = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
                      return (
                        <div key={cat}>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className={` border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLOR[cat]}`}>
                              {cat}
                            </span>
                            <span className="font-mono text-xs font-semibold text-on-surface">
                              {fmt(total)}
                            </span>
                          </div>
                          <div className="h-1 w-full overflow-hidden  bg-white/5">
                            <div
                              className="h-full  bg-rose-400/60 transition-all duration-500"
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
        </div>
      </div>
    </div>
  );
}
