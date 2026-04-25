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

      <div className="mb-8 border-l-2 border-primary pl-6">
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface uppercase">
          System <span className="text-primary">Config</span>
        </h1>
        <p className="mt-1 text-xs font-mono font-medium text-on-surface-variant uppercase tracking-widest">
          Account · Security · Billing · Session Parameters
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[220px_1fr]">
        <aside className="sticky top-20 space-y-0.5 py-3 px-2">
          {/* Main nav */}
          <nav className="space-y-0.5">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/[0.08] text-on-surface'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-white/[0.06] my-3 !mt-3 !mb-3" />

          {/* Policy & Help */}
          <nav className="space-y-0.5">
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
                  className={`flex w-full items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-white/[0.08] text-on-surface'
                      : 'text-on-surface-variant/80 hover:text-on-surface hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sign out */}
          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 mt-2 rounded-[10px] text-[13px] font-medium text-error/40 hover:text-error hover:bg-error/5 transition-all duration-150"
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </aside>

        <div>{tabContent}</div>
      </div>
    </div>
  );
}
