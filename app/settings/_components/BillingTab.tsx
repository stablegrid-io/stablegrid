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

// During beta, every account has full access. The €14.99 one-time payment is
// a Supporter contribution toward the build — not a feature unlock. Both
// columns therefore enumerate the same access; the difference is the badge.
const FEATURES = [
  { label: 'All Junior, Mid & Senior modules',  free: true, paid: true },
  { label: 'Complete practice library',          free: true, paid: true },
  { label: 'Grid game — earn, shop, restore',    free: true, paid: true },
  { label: 'All tracks, all tiers',              free: true, paid: true },
  { label: 'Session timers & reading modes',     free: true, paid: true },
  { label: 'Progress tracking',                  free: true, paid: true }
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

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Current Plan"
        description="Full access during beta. Become a Supporter to back the build — €14.99 once, no recurring fee."
        icon={<CreditCard className="h-4 w-4" />}
      >
        <div className="bg-surface border border-on-surface p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-h2 text-on-surface">
                  {isPaid ? 'Supporter' : 'Free'}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-on-surface bg-surface-container-low">
                  <span
                    aria-hidden
                    className="inline-block w-1.5 h-1.5 bg-on-surface"
                  />
                  <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface">
                    {isPaid ? 'Active · beta' : 'Free tier'}
                  </span>
                </span>
              </div>
              <p className="font-body text-[14px] text-on-surface-variant leading-relaxed mt-2">
                {isPaid
                  ? renewalText
                    ? `Renews on ${renewalText}. Cancel anytime.`
                    : 'Thank you — your contribution keeps the build going.'
                  : 'Everything below is unlocked while we’re in beta. €14.99 once is purely a contribution to keep the build going — no extra features, no renewals.'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className="font-data-mono tabular-nums text-on-surface leading-none"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}
              >
                {isPaid ? '€14.99' : '€0'}
              </p>
              <p className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant mt-2">
                {isPaid ? 'lifetime' : 'forever'}
              </p>
            </div>
          </div>

          <div className="my-5 h-px bg-surface-dim" />

          <div className="grid gap-2.5 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const enabled = isPaid ? feature.paid : feature.free;
              return (
                <div key={feature.label} className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center border ${
                      enabled
                        ? 'border-on-surface bg-on-surface'
                        : 'border-surface-dim bg-surface'
                    }`}
                  >
                    {enabled ? (
                      <Check
                        className="h-2.5 w-2.5 text-on-primary"
                        strokeWidth={3}
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="block h-[3px] w-[3px] bg-on-surface-variant/40"
                      />
                    )}
                  </div>
                  <span
                    className={`font-body text-[14px] leading-relaxed ${
                      enabled ? 'text-on-surface' : 'text-on-surface-variant/60'
                    }`}
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
                className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider px-5 py-3 border border-on-surface bg-on-surface text-on-primary hover:bg-on-surface/90 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
                {loading === 'upgrade' ? 'Redirecting…' : 'Support the build · €14.99 once'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => redirectToBillingUrl('/api/stripe/portal')}
                  disabled={loading === 'portal'}
                  className="inline-flex items-center gap-2 font-data-mono uppercase text-[11px] tracking-wider px-5 py-3 border border-on-surface text-on-surface hover:bg-surface-container-low transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading === 'portal'
                    ? 'Redirecting…'
                    : subscription?.stripe_sub_id
                      ? 'Manage subscription'
                      : 'View receipts'}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                {subscription?.stripe_sub_id ? (
                  <button
                    type="button"
                    onClick={() => setCancelOpen(true)}
                    className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant hover:text-primary transition-colors px-2 py-2"
                  >
                    Cancel subscription
                  </button>
                ) : null}
              </>
            )}
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
            <h3 className="text-lg font-semibold text-on-surface">
              Cancel your subscription?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
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
            <h3 className="text-lg font-semibold text-on-surface">
              Final confirmation
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
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

