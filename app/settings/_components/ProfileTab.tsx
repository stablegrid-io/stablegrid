'use client';

import { useEffect, useState } from 'react';
import { User, UserCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { StableGridMark } from '@/components/brand/StableGridLogo';
import { getUserTier } from '@/lib/energy';
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
  provider: string | null;
  onToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const PROFILE_AVATAR_UPDATED_EVENT = 'stablegrid:profile-avatar-updated';

const emitProfileAvatarUpdated = (avatarUrl: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(PROFILE_AVATAR_UPDATED_EVENT, {
      detail: { avatarUrl }
    })
  );
};

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  email: 'Email'
};

const getInitials = (name: string, email: string) => {
  const source = name.trim() || email.trim();
  if (!source) return '?';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

export function ProfileTab({ profile, userEmail, provider, onToast }: ProfileTabProps) {
  const supabase = createClient();
  const [name, setName] = useState(profile.name ?? '');
  const [avatarUrl] = useState<string | null>(profile.avatar_url);
  const [baseline, setBaseline] = useState<{
    name: string;
    avatarUrl: string | null;
  }>({
    name: profile.name ?? '',
    avatarUrl: profile.avatar_url
  });
  const [loading, setLoading] = useState(false);

  const xp = useProgressStore((state) => state.xp);
  const completedTracks = useProgressStore((state) => state.completedTracks);
  const [progressHydrated, setProgressHydrated] = useState(false);
  useEffect(() => {
    setProgressHydrated(true);
  }, []);
  const tier = getUserTier({ kwh: xp, completedTracks });
  const tierAccent =
    tier === 'senior' ? '#ff716c' : tier === 'mid' ? '#ffc965' : '#99f7ff';
  const tierLabel = tier === 'senior' ? 'Senior' : tier === 'mid' ? 'Mid' : 'Junior';

  const hasChanges =
    name !== baseline.name ||
    (avatarUrl ?? '') !== (baseline.avatarUrl ?? '');

  const providerLabel = provider ? PROVIDER_LABEL[provider] ?? provider : null;
  const initials = getInitials(name, userEmail);

  const handleSave = async () => {
    if (!hasChanges || loading) {
      return;
    }

    const avatarChanged = (avatarUrl ?? '') !== (baseline.avatarUrl ?? '');

    setLoading(true);

    try {
      const { error: profileError } = await supabase.from('profiles').upsert(
        {
          id: profile.id,
          name,
          email: userEmail,
          avatar_url: avatarUrl
        },
        { onConflict: 'id' }
      );

      if (profileError) {
        throw profileError;
      }

      if (avatarChanged) {
        emitProfileAvatarUpdated(avatarUrl);
      }

      onToast(
        avatarChanged ? 'Profile and picture saved.' : 'Profile saved.',
        'success'
      );

      setBaseline({ name, avatarUrl });
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
        description="Your identity on stablegrid."
        icon={<User className="h-4 w-4" />}
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 sm:items-start">
            <div
              className="relative h-24 w-24 flex items-center justify-center overflow-hidden rounded-full"
              aria-label={avatarUrl ? 'Profile picture' : `${tierLabel} tier`}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // OAuth avatar URLs occasionally rotate or 404. Hide the
                    // broken image so the tier-mark fallback paints in its
                    // place instead of leaving a busted icon visible.
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : progressHydrated ? (
                <StableGridMark
                  className="h-12 w-12"
                  style={{ color: tierAccent }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-xl font-bold tracking-wider text-on-surface/70">
                  {initials}
                </div>
              )}
            </div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface/70">
              {progressHydrated ? `${tierLabel} Tier` : ' '}
            </div>
            {provider && provider !== 'email' && providerLabel && (
              <div
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1"
                title={`Signed in with ${providerLabel}`}
              >
                <ProviderIcon provider={provider} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface/70">
                  {providerLabel}
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <SettingsField label="Display name">
              <SettingsInput
                value={name}
                onChange={setName}
                placeholder="Your display name"
              />
            </SettingsField>

            <div className="rounded-[14px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant/60">
                Email
              </p>
              <p className="mt-0.5 truncate text-sm text-on-surface/85">{userEmail || '—'}</p>
              {providerLabel && (
                <p className="mt-1 text-[11px] text-on-surface-variant/55">
                  Managed by {providerLabel}. To change, sign in with a different account.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || loading}
                className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:shadow-[0_0_16px_rgba(153,247,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Account Summary"
        icon={<UserCircle2 className="h-4 w-4" />}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCell label="Member since" value={formatMemberSince(profile.created_at)} />
          <SummaryCell label="Signed in with" value={providerLabel ?? '—'} />
          <SummaryCell label="Profile ID" value={profile.id.slice(0, 8)} mono />
        </div>
      </SettingsCard>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string | null }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
        <path
          fill="#fff"
          fillOpacity="0.85"
          d="M21.35 11.1H12v2.97h5.35c-.23 1.38-1.66 4.05-5.35 4.05-3.22 0-5.85-2.66-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.48C16.65 3.68 14.52 2.7 12 2.7 6.98 2.7 2.9 6.78 2.9 11.8S6.98 20.9 12 20.9c6.93 0 9.52-4.86 9.52-9.35 0-.63-.07-1.11-.17-1.45z"
        />
      </svg>
    );
  }
  if (provider === 'github') {
    return (
      <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
        <path
          fill="#fff"
          fillOpacity="0.85"
          d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 007.87 10.93c.58.11.79-.25.79-.55v-2.03c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 015.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.73.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.77 1.06.77 2.14v3.17c0 .31.21.67.8.55A11.5 11.5 0 0023.5 12C23.5 5.73 18.27.5 12 .5z"
        />
      </svg>
    );
  }
  return null;
}

function SummaryCell({
  label,
  value,
  mono = false
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-surface px-3 py-2">
      <p className="text-[11px] font-mono font-bold uppercase tracking-[0.1em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-medium text-text-light-primary dark:text-text-dark-primary ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </p>
    </div>
  );
}
