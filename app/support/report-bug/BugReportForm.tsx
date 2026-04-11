'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface ReportResponse {
  reported?: boolean;
  id?: string;
  error?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'ui_visual', label: 'UI / visual glitch' },
  { value: 'navigation', label: 'Navigation / redirect issue' },
  { value: 'data_progress', label: 'Data / progress issue' },
  { value: 'performance', label: 'Performance / slow behavior' },
  { value: 'auth_account', label: 'Auth / account issue' },
  { value: 'billing', label: 'Billing / subscription issue' },
  { value: 'crash_error', label: 'Crash / error message' },
  { value: 'other', label: 'Other' }
] as const;

const AREA_OPTIONS = [
  { value: 'home', label: 'Home / Dashboard' },
  { value: 'theory', label: 'Learn / Theory' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'missions', label: 'Missions' },
  { value: 'practice', label: 'Practice / Notebooks' },
  { value: 'grid_ops', label: 'Grid Ops / Energy' },
  { value: 'settings', label: 'Settings / Billing' },
  { value: 'auth', label: 'Login / Signup' },
  { value: 'other', label: 'Other' }
] as const;

const getInitialRoute = (from: string | null) => {
  if (!from) return '';
  return from.trim().slice(0, 500);
};

const createRequestKey = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `bug-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function BugReportForm() {
  const searchParams = useSearchParams();
  const initialRoute = useMemo(() => getInitialRoute(searchParams.get('from')), [searchParams]);
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [category, setCategory] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [reportId, setReportId] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(() => createRequestKey());

  const isSubmitting = submitState === 'submitting';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setSubmitState('submitting');
    setErrorMessage('');
    setReportId(null);

    try {
      const response = await fetch('/api/support/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': requestKey
        },
        body: JSON.stringify({
          title: summary,
          details,
          pageUrl: initialRoute || null,
          context: {
            category,
            area
          }
        })
      });
      const payload = (await response.json()) as ReportResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to submit bug report.');
      }

      setSubmitState('success');
      setReportId(payload.id ?? null);
      setCategory('');
      setArea('');
      setSummary('');
      setDetails('');
      setRequestKey(createRequestKey());
    } catch (error) {
      setSubmitState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unable to submit bug report.');
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="bug-category"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary"
          >
            Category
          </label>
          <select
            id="bug-category"
            name="category"
            required
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-4 py-3 text-sm text-text-light-primary outline-none transition focus:border-brand-500 dark:text-text-dark-primary"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="bug-area"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary"
          >
            Affected area
          </label>
          <select
            id="bug-area"
            name="area"
            required
            value={area}
            onChange={(event) => setArea(event.target.value)}
            className="w-full rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-4 py-3 text-sm text-text-light-primary outline-none transition focus:border-brand-500 dark:text-text-dark-primary"
          >
            <option value="">Select affected area</option>
            {AREA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bug-summary"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary"
        >
          Issue summary
        </label>
        <input
          id="bug-summary"
          name="summary"
          required
          minLength={5}
          maxLength={160}
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Short title for the bug"
          className="w-full rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-4 py-3 text-sm text-text-light-primary outline-none transition focus:border-brand-500 dark:text-text-dark-primary"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="bug-details"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-text-light-tertiary dark:text-text-dark-tertiary"
        >
          Details
        </label>
        <textarea
          id="bug-details"
          name="details"
          required
          minLength={10}
          maxLength={4000}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="What happened, what you expected, and how to reproduce it."
          rows={7}
          className="w-full resize-y rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-4 py-3 text-sm text-text-light-primary outline-none transition focus:border-brand-500 dark:text-text-dark-primary"
        />
      </div>

      {submitState === 'success' && (
        <p className="rounded-[14px] border border-success-500/30 bg-success-500/10 px-3 py-2 text-sm text-success-700 dark:text-success-300">
          Bug report submitted successfully{reportId ? ` (ID: ${reportId})` : ''}. Valid reports are
          compensated in kWh after triage.
        </p>
      )}
      {submitState === 'error' && (
        <p className="rounded-[14px] border border-error-500/30 bg-error-500/10 px-3 py-2 text-sm text-error-700 dark:text-error-300">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-[14px] border border-brand-500/40 bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-brand-400/50 dark:bg-brand-400 dark:text-slate-900 dark:hover:bg-brand-300"
      >
        {isSubmitting ? 'Submitting...' : 'Submit bug report'}
      </button>
    </form>
  );
}
