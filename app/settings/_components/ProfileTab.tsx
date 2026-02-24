'use client';

import { useMemo, useState } from 'react';
import { User, UserCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  SettingsCard,
  SettingsField,
  SettingsInput,
  formatMemberSince
} from './ui';
import type { ProfileRecord } from './types';

interface ProfileTabProps {
  profile: ProfileRecord;
  userEmail: string;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function ProfileTab({ profile, userEmail, onToast }: ProfileTabProps) {
  const supabase = createClient();
  const [name, setName] = useState(profile.name ?? '');
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);

  const initials = useMemo(() => {
    const source = (name || email || 'GL').trim();
    return source.slice(0, 2).toUpperCase();
  }, [name, email]);

  const hasChanges = name !== (profile.name ?? '') || email !== userEmail;

  const handleSave = async () => {
    if (!hasChanges || loading) {
      return;
    }

    setLoading(true);

    try {
      if (name !== (profile.name ?? '')) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: profile.id,
            name,
            email: userEmail
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          throw profileError;
        }
      }

      if (email !== userEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          throw emailError;
        }

        onToast(`Verification email sent to ${email}.`, 'info');
      } else {
        onToast('Profile saved.', 'success');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.';
      onToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <SettingsCard
        title="Personal Information"
        description="Update your profile and contact email."
        icon={<User className="h-4 w-4" />}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/15 text-lg font-semibold text-brand-500">
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                {name || userEmail}
              </p>
              <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                Member since {formatMemberSince(profile.created_at)}
              </p>
            </div>
          </div>

          <SettingsField label="Full name">
            <SettingsInput
              value={name}
              onChange={setName}
              placeholder="Your full name"
            />
          </SettingsField>

          <SettingsField
            label="Email address"
            hint={
              email !== userEmail
                ? 'A verification link will be sent to your new email.'
                : undefined
            }
          >
            <SettingsInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
          </SettingsField>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Account Summary"
        icon={<UserCircle2 className="h-4 w-4" />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCell label="Member since" value={formatMemberSince(profile.created_at)} />
          <SummaryCell label="Email" value={userEmail || '—'} />
          <SummaryCell label="Profile ID" value={profile.id.slice(0, 8)} />
          <SummaryCell label="Avatar" value={profile.avatar_url ? 'Custom' : 'Generated'} />
        </div>
      </SettingsCard>
    </div>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-light-border bg-light-bg px-3 py-2 dark:border-dark-border dark:bg-dark-bg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
        {value}
      </p>
    </div>
  );
}
