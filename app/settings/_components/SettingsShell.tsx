'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Clock3,
  CreditCard,
  FileText,
  LifeBuoy,
  Lock,
  LogOut,
  Moon,
  Shield,
  Sun,
  Trash2,
  User
} from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';
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
  const { resolvedTheme, setTheme } = useTheme();

  const initialTab = isTabId(searchParams.get('tab')) ? searchParams.get('tab') : 'profile';
  const [tab, setTab] = useState<SettingsTabId>(initialTab as SettingsTabId);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <SettingsToast toast={toast} />

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Manage your account, security, billing, and reading preferences.
        </p>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[220px_1fr]">
        <aside className="card sticky top-20 p-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  active
                    ? item.danger
                      ? 'bg-error-50 text-error-600 dark:bg-error-900/20 dark:text-error-300'
                      : 'bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                    : item.danger
                      ? 'text-error-500 hover:bg-error-50/70 dark:hover:bg-error-900/10'
                      : 'text-text-light-secondary hover:bg-light-hover dark:text-text-dark-secondary dark:hover:bg-dark-hover'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}

          <div className="divider my-2" />

          {mounted ? (
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-light-secondary transition-colors hover:bg-light-hover dark:text-text-dark-secondary dark:hover:bg-dark-hover"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          ) : null}

          <div className="mb-1 rounded-lg border border-light-border p-2 dark:border-dark-border">
            <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-light-tertiary dark:text-text-dark-tertiary">
              Policy & Help
            </p>
            <Link
              href="/privacy"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-light-secondary transition-colors hover:bg-light-hover dark:text-text-dark-secondary dark:hover:bg-dark-hover"
            >
              <Shield className="h-4 w-4" />
              Privacy
            </Link>
            <Link
              href="/terms"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-light-secondary transition-colors hover:bg-light-hover dark:text-text-dark-secondary dark:hover:bg-dark-hover"
            >
              <FileText className="h-4 w-4" />
              Terms
            </Link>
            <Link
              href="/support"
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-light-secondary transition-colors hover:bg-light-hover dark:text-text-dark-secondary dark:hover:bg-dark-hover"
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </Link>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-text-light-tertiary transition-colors hover:bg-light-hover hover:text-text-light-secondary dark:text-text-dark-tertiary dark:hover:bg-dark-hover dark:hover:text-text-dark-secondary"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <div>{tabContent}</div>
      </div>
    </div>
  );
}
