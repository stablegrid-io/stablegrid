'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Cookie,
  Clock3,
  CreditCard,
  FileText,
  LifeBuoy,
  LogOut,
  Shield,
  Trash2,
  User
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';
import { createClient } from '@/lib/supabase/client';
import { ProfileTab } from './ProfileTab';
import { BillingTab } from './BillingTab';
import { ReadingSessionsTab } from './ReadingSessionsTab';
import { DangerZoneTab } from './DangerZoneTab';
import { PrivacyTab } from './PrivacyTab';
import { TermsTab } from './TermsTab';
import { SupportTab } from './SupportTab';
import { SettingsToast } from './ui';
import type {
  ProfileRecord,
  SettingsTabId,
  SubscriptionRecord,
  ToastPayload
} from './types';

interface SettingsShellProps {
  profile: ProfileRecord;
  subscription: SubscriptionRecord | null;
  userEmail: string;
  provider: string | null;
}

const TABS: Array<{ id: SettingsTabId; label: string; icon: typeof User; danger?: boolean }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'reading', label: 'Reading Sessions', icon: Clock3 },
  { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true }
];

const EXTRA_TAB_IDS: SettingsTabId[] = ['privacy', 'terms', 'support'];

function isTabId(value: string | null): value is SettingsTabId {
  if (!value) {
    return false;
  }

  return TABS.some((tab) => tab.id === value) || EXTRA_TAB_IDS.includes(value as SettingsTabId);
}

export function SettingsShell({
  profile,
  subscription,
  userEmail,
  provider
}: SettingsShellProps) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialTab = isTabId(searchParams.get('tab')) ? searchParams.get('tab') : 'profile';
  const [tab, setTab] = useState<SettingsTabId>(initialTab as SettingsTabId);
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    if (isTabId(searchParams.get('tab'))) {
      setTab(searchParams.get('tab') as SettingsTabId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('tab') === tab) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.set('tab', tab);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, searchParams, tab]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 3200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (
    message: string,
    type: ToastPayload['type'] = 'success'
  ) => {
    setToast({
      id: Date.now(),
      message,
      type
    });
  };

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const tabContent = useMemo(() => {
    if (tab === 'profile') {
      return (
        <ProfileTab
          profile={profile}
          userEmail={userEmail}
          provider={provider}
          onToast={showToast}
        />
      );
    }

    if (tab === 'billing') {
      return <BillingTab subscription={subscription} onToast={showToast} />;
    }

    if (tab === 'reading') {
      return <ReadingSessionsTab onToast={showToast} />;
    }

    if (tab === 'privacy') {
      return <PrivacyTab />;
    }

    if (tab === 'terms') {
      return <TermsTab />;
    }

    if (tab === 'support') {
      return <SupportTab />;
    }

    return <DangerZoneTab onToast={showToast} />;
  }, [profile, subscription, tab, userEmail]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SettingsToast toast={toast} />

      <div className="mb-8 border-b border-on-surface pb-6">
        <h1 className="font-h1 text-h1 text-on-surface">
          Settings
        </h1>
      </div>

      {/* Mobile: horizontal scrolling tab pills (md:hidden) */}
      <div className="md:hidden mb-6 -mx-4 px-4 overflow-x-auto border-b border-surface-dim" style={{ scrollbarWidth: 'none' }}>
        <div className="flex items-stretch gap-1 min-w-max pb-px">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 font-ui-label text-[11px] uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant'
                }`}
              >
                <Icon className="h-[14px] w-[14px] flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {([
            { id: 'privacy' as SettingsTabId, label: 'Privacy', icon: Shield },
            { id: 'cookies' as SettingsTabId, label: 'Cookies', icon: Cookie, action: openCookiePreferencesDialog },
            { id: 'terms' as SettingsTabId, label: 'Terms', icon: FileText },
            { id: 'support' as SettingsTabId, label: 'Support', icon: LifeBuoy },
          ] as const).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={`m-${item.id}`}
                type="button"
                onClick={() => 'action' in item && item.action ? item.action() : setTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2.5 font-ui-label text-[11px] uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant'
                }`}
              >
                <Icon className="h-[14px] w-[14px] flex-shrink-0" strokeWidth={1.5} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-[220px_1fr]">
        {/* Desktop sidebar (hidden on mobile — replaced by pill bar above) */}
        <aside className="hidden md:block md:sticky md:top-20 border-r border-surface-dim">
          <nav className="flex flex-col">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 font-ui-label text-[12px] uppercase tracking-wider border-b border-surface-dim transition-colors ${
                    active
                      ? 'bg-surface-container text-primary border-l-2 border-l-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <nav className="flex flex-col mt-px">
            {([
              { id: 'privacy' as SettingsTabId, label: 'Privacy', icon: Shield },
              { id: 'cookies' as SettingsTabId, label: 'Cookies', icon: Cookie, action: openCookiePreferencesDialog },
              { id: 'terms' as SettingsTabId, label: 'Terms', icon: FileText },
              { id: 'support' as SettingsTabId, label: 'Support', icon: LifeBuoy },
            ] as const).map((item) => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => 'action' in item && item.action ? item.action() : setTab(item.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 font-ui-label text-[12px] uppercase tracking-wider border-b border-surface-dim transition-colors ${
                    isActive
                      ? 'bg-surface-container text-primary border-l-2 border-l-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 mt-4 font-ui-label text-[12px] uppercase tracking-wider text-error hover:bg-error-container transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </aside>

        <div className="min-w-0">
          {tabContent}

          {/* Mobile sign-out button (below content) */}
          <button
            type="button"
            onClick={onSignOut}
            className="md:hidden flex w-full items-center justify-center gap-3 px-4 py-4 mt-8 border border-error/40 font-ui-label text-[12px] uppercase tracking-wider text-error transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" strokeWidth={1.5} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
