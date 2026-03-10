'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bug, CreditCard, LifeBuoy, LogOut, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { formatUnitsAsKwh, unitsToKwh } from '@/lib/energy';

interface ShiftSummaryData {
  careerLevel: number;
  currentRole: string;
  nextRole: string;
  promotionReadinessPct: number;
  tenureStartDate: string | null;
  activeDaysLast30: number;
  criteriaMet: number;
  criteriaTotal: number;
}

type ShiftTone = 'critical' | 'focus' | 'ready' | 'neutral';

const clampPct = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const formatMenuDate = (value: string | null | undefined) => {
  if (!value) return 'No shift history yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'No shift history yet';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
};

const getShiftTone = ({
  remainingKwh,
  readinessPct,
  hasError
}: {
  remainingKwh: number;
  readinessPct: number;
  hasError: boolean;
}): ShiftTone => {
  if (hasError) return 'neutral';
  if (remainingKwh < 2) return 'critical';
  if (readinessPct >= 85) return 'ready';
  if (readinessPct >= 50 || remainingKwh < 5) return 'focus';
  return 'neutral';
};

const toneStyles: Record<
  ShiftTone,
  {
    track: string;
    progress: string;
    status: string;
  }
> = {
  critical: {
    track: 'stroke-error-400/35',
    progress: 'stroke-error-500 dark:stroke-error-400',
    status:
      'border-error-300/50 bg-error-100/80 text-error-700 dark:border-error-500/40 dark:bg-error-900/35 dark:text-error-300'
  },
  focus: {
    track: 'stroke-warning-400/35',
    progress: 'stroke-warning-500 dark:stroke-warning-400',
    status:
      'border-warning-300/50 bg-warning-100/80 text-warning-700 dark:border-warning-500/40 dark:bg-warning-900/35 dark:text-warning-300'
  },
  ready: {
    track: 'stroke-success-400/35',
    progress: 'stroke-success-500 dark:stroke-success-400',
    status:
      'border-success-300/50 bg-success-100/80 text-success-700 dark:border-success-500/40 dark:bg-success-900/35 dark:text-success-300'
  },
  neutral: {
    track: 'stroke-slate-400/30',
    progress: 'stroke-brand-500 dark:stroke-brand-300',
    status:
      'border-slate-300/60 bg-slate-100/70 text-slate-700 dark:border-slate-600/50 dark:bg-slate-700/30 dark:text-slate-200'
  }
};

function ShiftStatusRing({
  value,
  initials,
  tone,
  level
}: {
  value: number;
  initials: string;
  tone: ShiftTone;
  level: number;
}) {
  const normalizedValue = clampPct(value);
  const radius = 27;
  const strokeWidth = 6;
  const size = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg
        className="h-16 w-16 -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-label={`Promotion readiness ${normalizedValue}%`}
        role="img"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={toneStyles[tone].track}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={`${toneStyles[tone].progress} transition-[stroke-dashoffset] duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center rounded-full border border-light-border/70 bg-light-surface/95 text-xs font-semibold text-text-light-primary dark:border-dark-border/70 dark:bg-dark-surface/95 dark:text-text-dark-primary">
        {initials}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-brand-300/60 bg-light-surface/95 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-brand-700 shadow-sm dark:border-brand-400/50 dark:bg-dark-surface/95 dark:text-brand-200">
        L{Math.max(1, level)}
      </div>
    </div>
  );
}

export function UserMenu() {
  const { user, signOut } = useAuth();
  const { getAvailableBudgetUnits } = useProgressStore();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummaryData | null>(null);
  const [isShiftSummaryLoading, setIsShiftSummaryLoading] = useState(false);
  const [shiftSummaryError, setShiftSummaryError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointer = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('touchstart', handlePointer);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('touchstart', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user?.id) {
      return;
    }

    const abortController = new AbortController();
    setIsShiftSummaryLoading(true);
    setShiftSummaryError(null);

    const loadShiftSummary = async () => {
      try {
        const response = await fetch('/api/profile/shift-summary', {
          method: 'GET',
          signal: abortController.signal
        });
        if (!response.ok) {
          throw new Error(`Failed to load shift summary (${response.status}).`);
        }

        const payload = (await response.json()) as {
          data?: ShiftSummaryData;
        };
        if (abortController.signal.aborted) {
          return;
        }

        if (!payload?.data) {
          throw new Error('Shift summary payload is missing.');
        }

        setShiftSummary(payload.data);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }
        console.error('Failed to load shift summary:', error);
        setShiftSummaryError('Could not sync shift status.');
      } finally {
        if (!abortController.signal.aborted) {
          setIsShiftSummaryLoading(false);
        }
      }
    };

    void loadShiftSummary();

    return () => {
      abortController.abort();
    };
  }, [isOpen, user?.id]);

  if (!user) {
    return null;
  }

  const email = user.email ?? '';
  const initials = email
    ? email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase()
    : 'GL';
  const remainingUnits = getAvailableBudgetUnits();
  const remainingKwh = unitsToKwh(remainingUnits);
  const readinessPct = clampPct(shiftSummary?.promotionReadinessPct ?? 0);
  const careerLevel = shiftSummary?.careerLevel ?? 1;
  const tone = getShiftTone({
    remainingKwh,
    readinessPct,
    hasError: Boolean(shiftSummaryError)
  });
  const roleLabel = shiftSummary
    ? `Level ${shiftSummary.careerLevel} · ${shiftSummary.currentRole}`
    : 'Level 1 · Trainee Operator';
  const kwhBalanceLabel = `${formatUnitsAsKwh(remainingUnits)} balance`;
  const memberSinceLabel = formatMenuDate(
    shiftSummary?.tenureStartDate ?? user.created_at ?? null
  );
  const handleCloseMenu = () => setIsOpen(false);
  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setIsOpen(false);
    try {
      await signOut();
    } catch (error) {
      console.error('Failed to sign out from user menu:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-light-border bg-light-surface text-text-light-secondary shadow-sm transition hover:bg-light-hover dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary dark:hover:bg-dark-hover"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        title={email}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-900/20 dark:text-brand-300">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-light-border bg-light-surface shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:border-dark-border dark:bg-dark-surface">
          <div className="relative border-b border-light-border bg-[linear-gradient(140deg,rgba(34,185,153,0.14),rgba(14,165,233,0.08))] p-4 dark:border-dark-border dark:bg-[linear-gradient(140deg,rgba(34,185,153,0.2),rgba(14,165,233,0.12))]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,185,153,0.2),transparent_50%)]" />
            <div className="relative flex items-start gap-3">
              <ShiftStatusRing
                value={readinessPct}
                initials={initials}
                tone={tone}
                level={careerLevel}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600 dark:text-brand-300">
                  Shift Badge
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {email}
                </p>
                <p className="mt-1 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                  {roleLabel}
                </p>
              </div>
            </div>
            <div className="relative mt-3 flex items-center justify-between text-[11px] text-text-light-tertiary dark:text-text-dark-tertiary">
              <span>On record since {memberSinceLabel}</span>
              <span>{kwhBalanceLabel}</span>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="space-y-1 rounded-lg border border-light-border/80 bg-light-bg/70 p-2 dark:border-dark-border dark:bg-dark-bg/70">
              <Link
                href="/settings"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                href="/settings?tab=billing"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                <CreditCard className="h-4 w-4" />
                Manage subscription
              </Link>
              <Link
                href="/support"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                <LifeBuoy className="h-4 w-4" />
                Support
              </Link>
              <Link
                href={
                  pathname
                    ? `/support/report-bug?from=${encodeURIComponent(pathname)}`
                    : '/support/report-bug'
                }
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                <Bug className="h-4 w-4" />
                Report a bug
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={isSigningOut}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-text-light-secondary transition-colors hover:bg-light-hover hover:text-text-light-primary disabled:cursor-not-allowed disabled:opacity-60 dark:text-text-dark-secondary dark:hover:bg-dark-hover dark:hover:text-text-dark-primary"
              >
                <LogOut className="h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
