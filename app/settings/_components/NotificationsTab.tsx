'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SettingsCard, SettingsToggle } from './ui';
import type { NotificationPrefs, ProfileRecord } from './types';

interface NotificationsTabProps {
  profile: ProfileRecord;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DEFAULT_PREFS: NotificationPrefs = {
  streak_reminder: true,
  weekly_digest: true,
  new_content: false,
  practice_reminder: true,
  marketing: false
};

const PREF_KEYS: Array<{ key: keyof NotificationPrefs; label: string; sub: string }> = [
  {
    key: 'streak_reminder',
    label: 'Streak reminder',
    sub: 'Get notified before losing your streak.'
  },
  {
    key: 'weekly_digest',
    label: 'Weekly digest',
    sub: 'Receive progress summary every Monday.'
  },
  {
    key: 'new_content',
    label: 'New content alerts',
    sub: 'When chapters, functions, or questions are added.'
  },
  {
    key: 'practice_reminder',
    label: 'Daily practice nudge',
    sub: 'Gentle reminder to complete questions today.'
  },
  {
    key: 'marketing',
    label: 'Product updates',
    sub: 'Occasional announcements about new features.'
  }
];

export function NotificationsTab({ profile, onToast }: NotificationsTabProps) {
  const supabase = createClient();
  const initialPrefs = useMemo<NotificationPrefs>(
    () => profile.notification_prefs ?? DEFAULT_PREFS,
    [profile.notification_prefs]
  );
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [savedPrefs, setSavedPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs(initialPrefs);
    setSavedPrefs(initialPrefs);
  }, [initialPrefs]);

  const changed = useMemo(() => {
    return PREF_KEYS.some((item) => savedPrefs[item.key] !== prefs[item.key]);
  }, [prefs, savedPrefs]);

  const handleSave = async () => {
    if (saving || !changed) {
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: profile.id,
            notification_prefs: prefs
          },
          { onConflict: 'id' }
        );

      if (error) {
        throw error;
      }

      setSavedPrefs(prefs);
      onToast('Notification preferences saved.', 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save preferences.';
      onToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Email Notifications"
        description="Choose which account emails you want to receive."
        icon={<Bell className="h-4 w-4" />}
      >
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {PREF_KEYS.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                  {item.label}
                </p>
                <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                  {item.sub}
                </p>
              </div>
              <SettingsToggle
                checked={Boolean(prefs[item.key])}
                onChange={(value) =>
                  setPrefs((prev) => ({
                    ...prev,
                    [item.key]: value
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !changed}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
