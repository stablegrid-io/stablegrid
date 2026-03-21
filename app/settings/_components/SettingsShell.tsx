'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bug,
  Bell,
  Cookie,
  Clock3,
  CreditCard,
  FileText,
  LifeBuoy,
  Lock,
  LogOut,
  Shield,
  Trash2,
  User
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { openCookiePreferencesDialog } from '@/lib/cookies/cookie-consent';
import { createClient } from '@/lib/supabase/client';
import { ProfileTab } from './ProfileTab';
import { SecurityTab } from './SecurityTab';
import { BillingTab } from './BillingTab';
import { NotificationsTab } from './NotificationsTab';
import { ReadingSessionsTab } from './ReadingSessionsTab';
import { DangerZoneTab } from './DangerZoneTab';
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
}

const TABS: Array<{ id: SettingsTabId; label: string; icon: typeof User; danger?: boolean }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'reading', label: 'Reading Sessions', icon: Clock3 },
  { id: 'notifs', label: 'Notifications', icon: Bell },
  { id: 'danger', label: 'Danger Zone', icon: Trash2, danger: true }
];

function isTabId(value: string | null): value is SettingsTabId {
  if (!value) {
    return false;
  }

  return TABS.some((tab) => tab.id === value);
}

export function SettingsShell({
  profile,
  subscription,
  userEmail
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
          onToast={showToast}
        />
      );
    }

    if (tab === 'security') {
      return <SecurityTab onToast={showToast} />;
    }

    if (tab === 'billing') {
      return <BillingTab subscription={subscription} onToast={showToast} />;
    }

    if (tab === 'reading') {
      return <ReadingSessionsTab onToast={showToast} />;
    }

    if (tab === 'notifs') {
      return <NotificationsTab profile={profile} onToast={showToast} />;
    }

    return <DangerZoneTab onToast={showToast} />;
  }, [profile, subscription, tab, userEmail]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <SettingsToast toast={toast} />

      <div className="mb-8 border-l-2 border-primary pl-6">
        <h1 className="font-headline text-3xl font-extrabold tracking-tighter text-on-surface uppercase">
          System <span className="text-primary">Config</span>
        </h1>
        <p className="mt-1 font-mono text-xs text-on-surface-variant uppercase tracking-widest">
          Account · Security · Billing · Session Parameters
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[220px_1fr]">
        <aside className="sticky top-20 border border-outline-variant/20 bg-surface-container-low p-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`mb-0.5 flex w-full items-center gap-3 px-3 py-2 text-left font-mono text-xs uppercase tracking-wider transition-colors ${
                  active
                    ? item.danger
                      ? 'bg-error/10 text-error border-l-2 border-error'
                      : 'bg-primary/10 text-primary border-l-2 border-primary'
                    : item.danger
                      ? 'text-error/60 hover:bg-error/5 border-l-2 border-transparent'
                      : 'text-on-surface-variant hover:bg-surface-container-high border-l-2 border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}

          <div className="border-t border-outline-variant/20 my-2" />

          <div className="mb-1 border border-outline-variant/20 p-2">
            <p className="px-1 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Policy & Help
            </p>
            <Link
              href="/privacy"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary uppercase tracking-wider"
            >
              <Shield className="h-3.5 w-3.5" />
              Privacy
            </Link>
            <button
              type="button"
              onClick={openCookiePreferencesDialog}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary uppercase tracking-wider"
            >
              <Cookie className="h-3.5 w-3.5" />
              Cookies
            </button>
            <Link
              href="/terms"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary uppercase tracking-wider"
            >
              <FileText className="h-3.5 w-3.5" />
              Terms
            </Link>
            <Link
              href="/support"
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary uppercase tracking-wider"
            >
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </Link>
            <Link
              href={
                pathname
                  ? `/support/report-bug?from=${encodeURIComponent(pathname)}`
                  : '/support/report-bug'
              }
              className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-mono text-[10px] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary uppercase tracking-wider"
            >
              <Bug className="h-3.5 w-3.5" />
              Report Bug
            </Link>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[10px] text-error/50 transition-colors hover:bg-error/5 hover:text-error uppercase tracking-wider"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </aside>

        <div>{tabContent}</div>
      </div>
    </div>
  );
}
