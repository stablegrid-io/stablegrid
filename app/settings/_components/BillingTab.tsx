'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, CreditCard, ReceiptText, Zap } from 'lucide-react';
import { SettingsCard, SettingsModal } from './ui';
import type { SubscriptionRecord } from './types';

interface BillingTabProps {
  subscription: SubscriptionRecord | null;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Paid-tier feature matrix. Matches the landing pricing card bullets so copy
// stays consistent between the marketing page and the settings surface.
const FEATURES = [
  { label: 'All Junior, Mid & Senior modules',  free: false, paid: true  },
  { label: 'Complete practice library',          free: false, paid: true  },
  { label: 'Grid game — earn, shop, restore',    free: false, paid: true  },
  { label: 'All tracks, all tiers',              free: false, paid: true  },
  { label: 'Session timers & reading modes',     free: true,  paid: true  },
  { label: 'Progress tracking',                  free: true,  paid: true  }
] as const;

export function BillingTab({ subscription, onToast }: BillingTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<'upgrade' | 'portal' | 'cancel' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);
  const autoUpgradeFiredRef = useRef(false);

  // Accept both 'supporter' (new canonical name) and 'pro' (legacy) as paid.
  // This keeps any subscriber on the old plan label from being treated as free.
  const isPaid =
    (subscription?.plan === 'supporter' || subscription?.plan === 'pro') &&
    (subscription.status === 'active' || subscription.status === 'trialing');

  const renewalText = useMemo(() => {
    if (!subscription?.current_period_end) {
      return null;
    }

    return new Date(subscription.current_period_end).toLocaleDateString();
  }, [subscription?.current_period_end]);

  const redirectToBillingUrl = async (path: '/api/stripe/checkout' | '/api/stripe/portal') => {
    const mode = path.includes('checkout') ? 'upgrade' : 'portal';
    setLoading(mode);

    try {
      const response = await fetch(path, { method: 'POST' });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Unable to open Stripe flow.');
      }

      window.location.href = payload.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Billing action failed.';
      onToast(message, 'error');
      setLoading(null);
    }
  };

  // Auto-fire the checkout once if we were sent here with ?auto_upgrade=1
  // (from the landing page "Back the beta" CTA). Runs exactly once per mount,
  // only when the user isn't already paid. Strip the query param afterward so
  // refreshing doesn't re-trigger.
  useEffect(() => {
    if (autoUpgradeFiredRef.current) return;
    if (searchParams.get('auto_upgrade') !== '1') return;
    autoUpgradeFiredRef.current = true;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('auto_upgrade');
    const qs = nextParams.toString();
    router.replace(qs ? `/settings?${qs}` : '/settings');

    if (!isPaid) {
      void redirectToBillingUrl('/api/stripe/checkout');
    }
  }, [searchParams, router, isPaid]);

  const handleCancelSubscription = async () => {
    setLoading('cancel');

    try {
      const response = await fetch('/api/stripe/cancel', { method: 'POST' });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to cancel subscription.');
      }

      setCancelOpen(false);
      setCancelStep(1);
      onToast('Subscription cancellation requested.', 'info');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to cancel subscription.';
      onToast(message, 'error');
    } finally {
      setLoading(null);
    }
  };

  // Accent matches the landing pricing card: amber when subscribed, cyan when
  // on free tier. Keeping colors consistent across marketing + settings so the
  // user always sees the same visual language for their plan.
  const accent = isPaid
    ? { hex: '#ffc965', rgb: '255,201,101' }
    : { hex: '#99f7ff', rgb: '153,247,255' };

  return (
    <div className="space-y-5">
      <style>{`
        @keyframes billingTierPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>
      <SettingsCard
        title="Current Plan"
        description="Support the build — €2.99/month in beta gets you everything."
        icon={<CreditCard className="h-4 w-4" />}
      >
        <div
          className="relative overflow-hidden"
          style={{
            background: '#0f1215',
            borderRadius: 20,
            border: `1px solid rgba(${accent.rgb},${isPaid ? 0.3 : 0.14})`,
            boxShadow: isPaid
              ? `0 0 0 1px rgba(${accent.rgb},0.06), 0 20px 60px rgba(0,0,0,0.45), 0 0 50px rgba(${accent.rgb},0.08)`
              : '0 10px 40px rgba(0,0,0,0.35)'
          }}
        >
          <BillingCorner position="top-left" accentRgb={accent.rgb} />
          <BillingCorner position="bottom-right" accentRgb={accent.rgb} />

          <div className="relative p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: '-0.025em',
                      color: 'rgba(255,255,255,0.97)',
                      lineHeight: 1
                    }}
                  >
                    {isPaid ? 'Supporter' : 'Free'}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{
                      background: `rgba(${accent.rgb},0.1)`,
                      border: `1px solid rgba(${accent.rgb},0.32)`
                    }}
                  >
                    <span
                      className="inline-block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: accent.hex,
                        animation: isPaid ? 'billingTierPulse 1.6s ease-in-out infinite' : undefined
                      }}
                    />
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 9.5,
                        letterSpacing: '0.22em',
                        fontWeight: 700,
                        color: accent.hex,
                        textTransform: 'uppercase'
                      }}
                    >
                      {isPaid ? 'Active · beta' : 'Free tier'}
                    </span>
                  </span>
                </div>
                <p
                  className="mt-2"
                  style={{
                    fontSize: 13.5,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.5
                  }}
                >
                  {isPaid
                    ? renewalText
                      ? `Renews on ${renewalText}. Cancel anytime.`
                      : 'Your Supporter plan is active. Cancel anytime.'
                    : 'Back the beta to keep the build going — locked-in pricing for life.'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className="font-black tabular-nums"
                  style={{
                    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
                    letterSpacing: '-0.04em',
                    color: 'rgba(255,255,255,0.98)',
                    lineHeight: 1
                  }}
                >
                  {isPaid ? '€2.99' : '€0'}
                </p>
                <p
                  className="mt-1 font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.16em',
                    color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase',
                    fontWeight: 700
                  }}
                >
                  {isPaid ? '/ month' : 'forever'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div
              className="my-5 h-px"
              style={{
                background: `linear-gradient(to right, transparent, rgba(${accent.rgb},0.18), transparent)`
              }}
            />

            <div className="grid gap-2.5 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const enabled = isPaid ? feature.paid : feature.free;
                return (
                  <div key={feature.label} className="flex items-start gap-2.5">
                    <div
                      className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: enabled ? `rgba(${accent.rgb},0.14)` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          enabled ? `rgba(${accent.rgb},0.4)` : 'rgba(255,255,255,0.08)'
                        }`
                      }}
                    >
                      {enabled ? (
                        <Check
                          className="h-2.5 w-2.5"
                          strokeWidth={3}
                          style={{ color: accent.hex }}
                        />
                      ) : (
                        <span
                          className="block h-[3px] w-[3px] rounded-full"
                          style={{ background: 'rgba(255,255,255,0.3)' }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: enabled ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.28)',
                        lineHeight: 1.5
                      }}
                    >
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {!isPaid ? (
                <button
                  type="button"
                  onClick={() => redirectToBillingUrl('/api/stripe/checkout')}
                  disabled={loading === 'upgrade'}
                  className="inline-flex items-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    padding: '12px 20px',
                    borderRadius: 14,
                    background: '#ffc965',
                    color: '#0a0c0e',
                    fontSize: 12.5,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    border: '1px solid transparent',
                    boxShadow: '0 8px 30px rgba(255,201,101,0.22)'
                  }}
                  onMouseOver={(e) => {
                    if (loading === 'upgrade') return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,201,101,0.36)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,201,101,0.22)';
                  }}
                >
                  <Zap className="h-3.5 w-3.5" strokeWidth={2.5} />
                  {loading === 'upgrade' ? 'Redirecting…' : 'Back the beta · €2.99/month'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => redirectToBillingUrl('/api/stripe/portal')}
                    disabled={loading === 'portal'}
                    className="inline-flex items-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      padding: '12px 20px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.88)',
                      fontSize: 12.5,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseOver={(e) => {
                      if (loading === 'portal') return;
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    {loading === 'portal' ? 'Redirecting…' : 'Manage subscription'}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="font-mono transition-colors"
                    style={{
                      fontSize: 10.5,
                      letterSpacing: '0.22em',
                      color: 'rgba(255,255,255,0.3)',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '6px 4px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = 'rgba(255,113,108,0.85)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                    }}
                  >
                    Cancel subscription
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </SettingsCard>

      {isPaid ? (
        <SettingsCard
          title="Billing History"
          description="Use Stripe Portal for invoices and payment methods."
          icon={<ReceiptText className="h-4 w-4" />}
        >
          <button
            type="button"
            onClick={() => redirectToBillingUrl('/api/stripe/portal')}
            disabled={loading === 'portal'}
            className="btn btn-secondary"
          >
            {loading === 'portal' ? 'Redirecting...' : 'Open Stripe Customer Portal'}
          </button>
        </SettingsCard>
      ) : null}

      <SettingsModal
        open={cancelOpen}
        onClose={() => {
          setCancelOpen(false);
          setCancelStep(1);
        }}
      >
        {cancelStep === 1 ? (
          <div>
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Cancel your subscription?
            </h3>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              You will lose Supporter access when cancellation is processed. Your progress data will remain.
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => setCancelOpen(false)} className="btn btn-primary">
                Keep supporting
              </button>
              <button type="button" onClick={() => setCancelStep(2)} className="btn btn-secondary">
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
              Final confirmation
            </h3>
            <p className="mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary">
              Confirm cancellation. You can re-subscribe at any time.
            </p>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={loading === 'cancel'}
                className="btn btn-danger"
              >
                {loading === 'cancel' ? 'Cancelling...' : 'Yes, cancel subscription'}
              </button>
              <button type="button" onClick={() => setCancelStep(1)} className="btn btn-secondary">
                Go back
              </button>
            </div>
          </div>
        )}
      </SettingsModal>
    </div>
  );
}

// L-bracket corner marker — matches the landing pricing card + /progress
// character tier hero. Two 1px lines meeting at the corner in the plan's
// accent color.
function BillingCorner({
  position,
  accentRgb
}: {
  position: 'top-left' | 'bottom-right';
  accentRgb: string;
}) {
  const isTop = position.startsWith('top');
  const isLeft = position.endsWith('left');
  const color = `rgba(${accentRgb},0.5)`;
  const size = 18;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        [isTop ? 'top' : 'bottom']: 0,
        [isLeft ? 'left' : 'right']: 0,
        width: size,
        height: size,
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: '100%',
          height: 1,
          background: color
        }}
      />
      <div
        style={{
          position: 'absolute',
          [isTop ? 'top' : 'bottom']: 0,
          [isLeft ? 'left' : 'right']: 0,
          width: 1,
          height: '100%',
          background: color
        }}
      />
    </div>
  );
}
