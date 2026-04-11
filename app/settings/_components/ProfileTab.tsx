'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Trash2, User, UserCircle2 } from 'lucide-react';
import NextImage from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/useAuthStore';
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

const MAX_AVATAR_BYTES = 4 * 1024 * 1024;
const AVATAR_CANVAS_SIZE = 256;
const PROFILE_AVATAR_UPDATED_EVENT = 'stablegrid:profile-avatar-updated';

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read selected image.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => {
      reject(new Error('Could not read selected image.'));
    };
    reader.readAsDataURL(file);
  });

const normalizePngAvatar = async (file: File) => {
  const source = await readFileAsDataUrl(file);

  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = AVATAR_CANVAS_SIZE;
      canvas.height = AVATAR_CANVAS_SIZE;

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Could not process selected image.'));
        return;
      }

      const scale = Math.max(
        AVATAR_CANVAS_SIZE / image.width,
        AVATAR_CANVAS_SIZE / image.height
      );
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (AVATAR_CANVAS_SIZE - drawWidth) / 2;
      const offsetY = (AVATAR_CANVAS_SIZE - drawHeight) / 2;

      context.clearRect(0, 0, AVATAR_CANVAS_SIZE, AVATAR_CANVAS_SIZE);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = () => {
      reject(new Error('Could not process selected PNG.'));
    };
    image.src = source;
  });
};

const isPngFile = (file: File) =>
  file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(profile.name ?? '');
  const [email, setEmail] = useState(userEmail);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [avatarProcessing, setAvatarProcessing] = useState(false);
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

  const initials = useMemo(() => {
    const source = (name || email || 'GL').trim();
    return source.slice(0, 2).toUpperCase();
  }, [name, email]);

  const hasChanges =
    name !== baseline.name ||
    email !== baseline.email ||
    (avatarUrl ?? '') !== (baseline.avatarUrl ?? '');

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!isPngFile(file)) {
      onToast('Only PNG files are supported.', 'error');
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      onToast('PNG is too large. Maximum size is 4 MB.', 'error');
      return;
    }

    setAvatarProcessing(true);
    try {
      const normalizedAvatar = await normalizePngAvatar(file);
      setAvatarUrl(normalizedAvatar);
      onToast('PNG ready. Save changes to apply.', 'info');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to process selected PNG.';
      onToast(message, 'error');
    } finally {
      setAvatarProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || loading || avatarProcessing) {
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
      <SettingsCard
        title="Personal Information"
        description="Update your profile and contact email."
        icon={<User className="h-4 w-4" />}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-[22px] border border-white/[0.06] bg-[#0c0e10] p-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-500/15 text-lg font-semibold text-brand-500">
              {avatarUrl ? (
                <NextImage
                  src={avatarUrl}
                  alt="Profile avatar"
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
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

          <SettingsField label="Profile picture (PNG)" hint="PNG only. Max 4 MB.">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || avatarProcessing}
                className="inline-flex items-center gap-2 rounded-[14px] border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:bg-primary/10 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ImagePlus className="h-4 w-4" />
                {avatarProcessing ? 'Processing...' : 'Upload PNG'}
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  disabled={loading || avatarProcessing}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-error/20 px-4 py-2 text-xs uppercase tracking-widest text-error/70 transition-colors hover:bg-error/10 hover:border-error/40 hover:text-error disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              ) : null}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,.png"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </SettingsField>

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
              disabled={!hasChanges || loading || avatarProcessing}
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
          <SummaryCell label="Avatar" value={avatarUrl ? 'Custom PNG' : 'Generated'} />
        </div>
      </SettingsCard>
    </div>
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
