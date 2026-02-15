'use client';

import { useMemo, useState } from 'react';
import { CreditCard, ReceiptText, Zap } from 'lucide-react';
import { SettingsCard, SettingsModal } from './ui';
import type { SubscriptionRecord } from './types';

interface BillingTabProps {
  subscription: SubscriptionRecord | null;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FEATURES = [
  {
    label: 'SQL and Python topics',
    free: true,
    pro: true
  },
  {
    label: 'PySpark topic',
    free: false,
    pro: true
  },
  {
    label: 'Microsoft Fabric topic',
    free: false,
    pro: true
  },
  {
    label: 'Unlimited practice questions',
    free: false,
    pro: true
  },
  {
    label: 'In-browser code execution',
    free: false,
    pro: true
  },
  {
    label: 'Progress tracking',
    free: true,
    pro: true
  }
] as const;

export function BillingTab({ subscription, onToast }: BillingTabProps) {
  const [loading, setLoading] = useState<'upgrade' | 'portal' | 'cancel' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<1 | 2>(1);

  const isPro =
    subscription?.plan === 'pro' &&
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
        description="Upgrade to Pro for full topic access and unlimited practice."
        icon={<CreditCard className="h-4 w-4" />}
      >
        <div className="rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                  {isPro ? 'Pro' : 'Free'}
                </h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                    isPro
                      ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300'
                      : 'bg-light-border text-text-light-tertiary dark:bg-dark-border dark:text-text-dark-tertiary'
                  }`}
                >
                  {isPro ? 'Active' : 'Free tier'}
                </span>
              </div>
              <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {isPro
                  ? renewalText
                    ? `Renews on ${renewalText}`
                    : 'Pro plan is active.'
                  : 'Upgrade to unlock all topics and unlimited questions.'}
              </p>
            </div>
            <p className="text-3xl font-semibold text-text-light-primary dark:text-text-dark-primary">
              {isPro ? '$12' : '$0'}
              <span className="ml-1 text-xs font-normal text-text-light-tertiary dark:text-text-dark-tertiary">
                /month
              </span>
            </p>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const enabled = isPro ? feature.pro : feature.free;
              return (
                <div
                  key={feature.label}
                  className={`flex items-center gap-2 text-sm ${
                    enabled
                      ? 'text-text-light-secondary dark:text-text-dark-secondary'
                      : 'text-text-light-tertiary dark:text-text-dark-tertiary'
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      enabled
                        ? 'bg-success-500/15 text-success-600 dark:text-success-400'
                        : 'bg-light-border text-text-light-tertiary dark:bg-dark-border dark:text-text-dark-tertiary'
                    }`}
                  >
                    {enabled ? '✓' : '•'}
                  </span>
                  {feature.label}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!isPro ? (
              <button
                type="button"
                onClick={() => redirectToBillingUrl('/api/stripe/checkout')}
                disabled={loading === 'upgrade'}
                className="btn btn-primary"
              >
                <Zap className="h-4 w-4" />
                {loading === 'upgrade' ? 'Redirecting...' : 'Upgrade to Pro — $12/month'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => redirectToBillingUrl('/api/stripe/portal')}
                  disabled={loading === 'portal'}
                  className="btn btn-secondary"
                >
                  {loading === 'portal' ? 'Redirecting...' : 'Manage subscription'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelOpen(true)}
                  className="text-sm font-medium text-text-light-tertiary hover:text-error-600 dark:text-text-dark-tertiary dark:hover:text-error-400"
                >
                  Cancel subscription
                </button>
              </>
            )}
          </div>
        </div>
      </SettingsCard>

      {isPro ? (
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
              You will lose Pro access when cancellation is processed. Your progress data will remain.
            </p>
            <div className="mt-6 flex gap-2">
              <button type="button" onClick={() => setCancelOpen(false)} className="btn btn-primary">
                Keep Pro
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
