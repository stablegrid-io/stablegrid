'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CreditCard, LifeBuoy, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgressStore } from '@/lib/stores/useProgressStore';

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
      'border-error-300/50 bg-error-100/80 text-error-700   '
  },
  focus: {
    track: 'stroke-warning-400/35',
    progress: 'stroke-warning-500 dark:stroke-warning-400',
    status:
      'border-warning-300/50 bg-warning-100/80 text-warning-700   '
  },
  ready: {
    track: 'stroke-success-400/35',
    progress: 'stroke-success-500 dark:stroke-success-400',
    status:
      'border-success-300/50 bg-success-100/80 text-success-700   '
  },
  neutral: {
    track: 'stroke-slate-400/30',
    progress: 'stroke-brand-500 dark:stroke-brand-300',
    status:
      'border-slate-300/60 bg-slate-100/70 text-slate-700   '
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
      <div className="absolute inset-0 flex items-center justify-center rounded-full border border-surface-dim/70 bg-surface-container/95 text-xs font-semibold text-on-surface">
        {initials}
      </div>
      <div className="absolute -bottom-0.5 -right-0.5 rounded-full border border-primary-fixed-dim/60 bg-surface-container/95 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-primary-dim shadow-sm">
        L{Math.max(1, level)}
      </div>
    </div>
  );
}

export function UserMenu({
  align = 'end',
  placement = 'bottom',
  appearance = 'default'
}: {
  align?: 'start' | 'end';
  placement?: 'bottom' | 'right';
  appearance?: 'default' | 'rail';
}) {
  const { user, signOut } = useAuth();
  const { getAvailableBudgetUnits } = useProgressStore();
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
  const remainingKwh = 0;
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
  const kwhBalanceLabel = '';
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

  const isRailAppearance = appearance === 'rail';
  const buttonClassName = isRailAppearance
    ? 'group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-on-surface/10 bg-[linear-gradient(180deg,rgba(35,39,47,0.76),rgba(14,17,22,0.94))] text-[#f3f5f8] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_18px_32px_-22px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-200 hover:border-on-surface/16 hover:bg-[linear-gradient(180deg,rgba(42,47,56,0.82),rgba(18,22,28,0.96))] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_24px_38px_-24px_rgba(0,0,0,0.98)]'
    : 'flex h-11 w-11 items-center justify-center rounded-full border border-surface-dim bg-surface-container text-on-surface-variant shadow-sm transition hover:bg-surface-container    ';
  const initialsClassName = isRailAppearance
    ? 'relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.12),rgba(255,255,255,0.02)_42%,transparent_65%),linear-gradient(180deg,rgba(16,21,29,0.88),rgba(10,13,18,0.96))] text-[0.98rem] font-semibold tracking-[-0.02em] text-[#f5f7fa] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
    : 'flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-sm font-semibold text-primary-dim  ';
  const panelClassName = isRailAppearance
    ? 'border-on-surface/10 bg-[linear-gradient(180deg,rgba(20,24,31,0.96),rgba(12,15,20,0.98))] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.98)] backdrop-blur-2xl  (180deg,rgba(20,24,31,0.96),rgba(12,15,20,0.98))]'
    : 'border-surface-dim bg-surface-container shadow-[0_20px_50px_rgba(0,0,0,0.25)]  ';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        title={email}
      >
        {isRailAppearance ? (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[1px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.1),transparent_32%,transparent)]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[6px] rounded-full border border-on-surface/[0.05]"
            />
          </>
        ) : null}
        <div className={initialsClassName}>
          {initials}
        </div>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-[22rem] max-w-[calc(100vw-1rem)] overflow-hidden  border ${
            panelClassName
          } ${
            placement === 'right'
              ? 'bottom-0 left-[calc(100%+0.9rem)]'
              : `mt-3 ${align === 'start' ? 'left-0' : 'right-0'}`
          }`}
        >
          <div className="relative border-b border-surface-dim bg-[linear-gradient(140deg,rgba(34,185,153,0.14),rgba(14,165,233,0.08))] p-4 (140deg,rgba(34,185,153,0.2),rgba(14,165,233,0.12))]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,185,153,0.2),transparent_50%)]" />
            <div className="relative flex items-start gap-3">
              <ShiftStatusRing
                value={readinessPct}
                initials={initials}
                tone={tone}
                level={careerLevel}
              />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-dim">
                  Shift Badge
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-on-surface">
                  {email}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  {roleLabel}
                </p>
              </div>
            </div>
            <div className="relative mt-3 flex items-center justify-between text-[11px] text-on-surface-variant">
              <span>On record since {memberSinceLabel}</span>
              <span>{kwhBalanceLabel}</span>
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="space-y-1 rounded-lg border border-surface-dim/80 bg-surface/70 p-2">
              <Link
                href="/settings"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                href="/settings?tab=billing"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <CreditCard className="h-4 w-4" />
                Manage subscription
              </Link>
              <Link
                href="/support"
                onClick={handleCloseMenu}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                <LifeBuoy className="h-4 w-4" />
                Support
              </Link>
              <div
                role="separator"
                className="mx-2.5 my-1 h-px bg-surface-dim/80"
              />
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                disabled={isSigningOut}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface disabled:cursor-not-allowed disabled:opacity-60"
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
