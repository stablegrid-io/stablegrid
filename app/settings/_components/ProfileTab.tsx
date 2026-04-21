'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, UserCircle2, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import {
  getUserTier,
  getTierProfileImage,
  getNextTierThreshold,
  USER_TIER_THRESHOLDS,
} from '@/lib/energy';
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

export function ProfileTab({ profile, userEmail, onToast }: ProfileTabProps) {
  const supabase = createClient();
  const setUser = useAuthStore((state) => state.setUser);
  const [name, setName] = useState(profile.name ?? '');
  const [email, setEmail] = useState(userEmail);
  const [avatarUrl] = useState<string | null>(profile.avatar_url);
  const [baseline, setBaseline] = useState<{
    name: string;
    email: string;
    avatarUrl: string | null;
  }>({
    name: profile.name ?? '',
    email: userEmail,
    avatarUrl: profile.avatar_url
  });
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name !== baseline.name ||
    email !== baseline.email ||
    (avatarUrl ?? '') !== (baseline.avatarUrl ?? '');

  const handleSave = async () => {
    if (!hasChanges || loading) {
      return;
    }

    const nameChanged = name !== baseline.name;
    const emailChanged = email !== baseline.email;
    const avatarChanged = (avatarUrl ?? '') !== (baseline.avatarUrl ?? '');

    setLoading(true);

    try {
      if (nameChanged || avatarChanged) {
        const { error: profileError } = await supabase.from('profiles').upsert(
          {
            id: profile.id,
            name,
            email,
            avatar_url: avatarUrl
          },
          { onConflict: 'id' }
        );

        if (profileError) {
          throw profileError;
        }
      }

      if (emailChanged) {
        const updatePayload: {
          email?: string;
        } = {};

        if (emailChanged) {
          updatePayload.email = email;
        }

        const { data: authData, error: authError } = await supabase.auth.updateUser(updatePayload);
        if (authError) {
          throw authError;
        }

        if (authData.user) {
          setUser(authData.user);
        }
      }

      if (avatarChanged) {
        emitProfileAvatarUpdated(avatarUrl);
      }

      if (emailChanged) {
        onToast(`Verification email sent to ${email}.`, 'info');
      } else if (avatarChanged && nameChanged) {
        onToast('Profile and picture saved.', 'success');
      } else if (avatarChanged) {
        onToast('Profile picture saved.', 'success');
      } else {
        onToast('Profile saved.', 'success');
      }

      setBaseline({
        name,
        email,
        avatarUrl
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.';
      onToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <CharacterTierCard />

      <SettingsCard
        title="Personal Information"
        description="Update your profile and contact email."
        icon={<User className="h-4 w-4" />}
      >
        <div className="space-y-5">
          <div className="rounded-[22px] border border-white/[0.06] bg-[#0c0e10] p-4">
            <p className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {name || userEmail}
            </p>
            <p className="text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
              Member since {formatMemberSince(profile.created_at)}
            </p>
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
              className="rounded-[14px] bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-all hover:shadow-[0_0_16px_rgba(153,247,255,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
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
        </div>
      </SettingsCard>
    </div>
  );
}

const TIER_META: Record<'junior' | 'mid' | 'senior', { label: string; accent: string; rgb: string }> = {
  junior: { label: 'Junior', accent: '#99f7ff', rgb: '153,247,255' },
  mid: { label: 'Mid', accent: '#ffc965', rgb: '255,201,101' },
  senior: { label: 'Senior', accent: '#ff716c', rgb: '255,113,108' },
};

function CharacterTierCard() {
  const xp = useProgressStore((state) => state.xp);
  const tier = getUserTier(xp);
  const meta = TIER_META[tier];
  const image = getTierProfileImage(tier);
  const nextThreshold = getNextTierThreshold(tier);
  const currentThreshold = USER_TIER_THRESHOLDS[tier];
  const progressPct = nextThreshold
    ? Math.min(100, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
    : 100;
  const toNext = nextThreshold ? Math.max(0, nextThreshold - xp) : 0;

  return (
    <SettingsCard
      title="Character Tier"
      description="Your avatar evolves as you accumulate kWh from learning."
      icon={<Zap className="h-4 w-4" />}
    >
      <div
        className="rounded-[22px] border bg-[#0c0e10] p-5"
        style={{ borderColor: `rgba(${meta.rgb},0.18)` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2"
            style={{ ['--tw-ring-color' as string]: `rgba(${meta.rgb},0.4)` }}
          >
            <Image src={image} alt={`${meta.label} tier`} fill unoptimized className="object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span
                className="text-lg font-bold tracking-tight"
                style={{ color: meta.accent }}
              >
                {meta.label}
              </span>
              <span className="text-[11px] uppercase tracking-[0.12em] text-text-dark-tertiary">
                Tier
              </span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-text-dark-primary">
              {xp.toLocaleString()} <span className="text-[11px] font-medium text-text-dark-tertiary">kWh stored</span>
            </p>
          </div>
        </div>

        {nextThreshold ? (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[11px] uppercase tracking-[0.12em] text-text-dark-tertiary">
              <span>Progress to next tier</span>
              <span>{toNext.toLocaleString()} kWh to go</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}80)`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-text-dark-tertiary">
            Maximum tier reached.
          </p>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.04] pt-3">
          {(['junior', 'mid', 'senior'] as const).map((t) => {
            const isCurrent = t === tier;
            const m = TIER_META[t];
            return (
              <div
                key={t}
                className="rounded-[10px] px-2 py-1.5 text-center transition-colors"
                style={{
                  backgroundColor: isCurrent ? `rgba(${m.rgb},0.08)` : 'transparent',
                  border: `1px solid ${isCurrent ? `rgba(${m.rgb},0.18)` : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: isCurrent ? m.accent : 'rgba(255,255,255,0.3)' }}
                >
                  {m.label}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-text-dark-tertiary">
                  {USER_TIER_THRESHOLDS[t].toLocaleString()}+
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </SettingsCard>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-white/[0.06] bg-[#0c0e10] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-light-tertiary dark:text-text-dark-tertiary">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
        {value}
      </p>
    </div>
  );
}
