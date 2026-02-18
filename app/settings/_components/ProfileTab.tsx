'use client';

import { useMemo, useState } from 'react';
import { Sparkles, User, UserCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PulseMascot3D } from '@/components/mascot/PulseMascot3D';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import type { PulseAction, PulseMood, PulseMotion } from '@/types/mascot';
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
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseAction = usePulseMascotStore((state) => state.action);
  const setPulseMood = usePulseMascotStore((state) => state.setMood);
  const setPulseMotion = usePulseMascotStore((state) => state.setMotion);
  const setPulseAction = usePulseMascotStore((state) => state.setAction);
  const [name, setName] = useState(profile.name ?? '');
  const [email, setEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

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

  const applyTraits = ({
    mood,
    motion,
    action
  }: {
    mood: PulseMood;
    motion: PulseMotion;
    action: PulseAction;
  }) => {
    setPulseMood(mood);
    setPulseMotion(motion);
    setPulseAction(action);
  };

  const handleApplyPreset = (preset: PulsePreset) => {
    applyTraits(preset);
    setActivePresetId(preset.id);
    onToast(`${preset.label} preset applied for Elektrainis.`, 'success');
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
        title="Elektrainis"
        description="Configure the waveform mascot that appears after chapter, flashcard, and mission completion."
        icon={<Sparkles className="h-4 w-4" />}
      >
        <div className="space-y-5">
          <div className="grid gap-4 rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg lg:grid-cols-[220px_1fr] lg:items-center">
            <div className="rounded-xl border border-brand-200/60 bg-light-surface p-3 dark:border-brand-700/30 dark:bg-dark-surface">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                Live Preview
              </div>
              <div className="mx-auto flex h-36 w-36 items-center justify-center">
                <PulseMascot3D
                  mood={pulseMood}
                  motion={pulseMotion}
                  action={pulseAction}
                  height={132}
                  interactive
                  showLabel={false}
                  title="Elektrainis preview"
                  modelUrl={process.env.NEXT_PUBLIC_PULSE_MODEL_URL}
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                Elektrainis Traits
              </p>
              <p className="text-xs leading-relaxed text-text-light-tertiary dark:text-text-dark-tertiary">
                These traits apply everywhere Elektrainis appears: completion banners, mission debriefs, and companion overlays.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge label={`Expression: ${PULSE_MOOD_LABELS[pulseMood]}`} />
                <Badge label={`Motion: ${PULSE_MOTION_LABELS[pulseMotion]}`} />
                <Badge label={`Action: ${PULSE_ACTION_LABELS[pulseAction]}`} />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-light-border bg-light-bg p-4 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
                Quick Presets
              </p>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {PULSE_PRESETS.map((preset) => {
                const isActive =
                  activePresetId === preset.id ||
                  (pulseMood === preset.mood &&
                    pulseMotion === preset.motion &&
                    pulseAction === preset.action);

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                      isActive
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-500/70 dark:bg-brand-900/25'
                        : 'border-light-border bg-light-surface hover:border-brand-300 dark:border-dark-border dark:bg-dark-surface dark:hover:border-brand-700/50'
                    }`}
                  >
                    <p className="text-sm font-semibold text-text-light-primary dark:text-text-dark-primary">
                      {preset.label}
                    </p>
                    <p className="mt-0.5 text-xs text-text-light-tertiary dark:text-text-dark-tertiary">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
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
          <SummaryCell label="Elektrainis mood" value={PULSE_MOOD_LABELS[pulseMood]} />
          <SummaryCell label="Elektrainis motion" value={PULSE_MOTION_LABELS[pulseMotion]} />
          <SummaryCell label="Elektrainis action" value={PULSE_ACTION_LABELS[pulseAction]} />
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

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-[11px] font-medium text-text-light-secondary dark:border-dark-border dark:bg-dark-surface dark:text-text-dark-secondary">
      {label}
    </span>
  );
}

type PulsePreset = {
  id: string;
  label: string;
  description: string;
  mood: PulseMood;
  motion: PulseMotion;
  action: PulseAction;
};

const PULSE_PRESETS: PulsePreset[] = [
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    description: 'Quiet and disciplined for theory chapters and long reads.',
    mood: 'calm',
    motion: 'steady',
    action: 'idle'
  },
  {
    id: 'daily-ops',
    label: 'Daily Ops',
    description: 'Balanced profile for regular practice and reviews.',
    mood: 'focused',
    motion: 'flow',
    action: 'wave'
  },
  {
    id: 'incident-mode',
    label: 'Incident Mode',
    description: 'Fast and reactive for mission debugging pressure.',
    mood: 'alert',
    motion: 'surge',
    action: 'wave'
  },
  {
    id: 'victory-lap',
    label: 'Victory Lap',
    description: 'Playful, energetic animation for completions and streaks.',
    mood: 'happy',
    motion: 'surge',
    action: 'celebrate'
  }
];

const PULSE_MOOD_LABELS: Record<PulseMood, string> = {
  calm: 'Calm',
  focused: 'Focused',
  happy: 'Happy',
  alert: 'Alert'
};

const PULSE_MOTION_LABELS: Record<PulseMotion, string> = {
  steady: 'Steady',
  flow: 'Flow',
  surge: 'Surge'
};

const PULSE_ACTION_LABELS: Record<PulseAction, string> = {
  idle: 'Idle',
  wave: 'Wave',
  celebrate: 'Celebrate'
};
