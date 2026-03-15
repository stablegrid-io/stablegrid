import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsShell } from './_components/SettingsShell';
import type { ProfileRecord, SubscriptionRecord } from './_components/types';

export const metadata = {
  title: 'stableGrid.io'
};

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profileResult, subscriptionResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, avatar_url, created_at, notification_prefs')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('subscriptions')
      .select('plan, status, current_period_end, stripe_customer_id, stripe_sub_id')
      .eq('user_id', user.id)
      .maybeSingle()
  ]);

  const metadataAvatarRaw = user.user_metadata?.avatar_url;
  const metadataAvatar =
    typeof metadataAvatarRaw === 'string' &&
    metadataAvatarRaw.trim().length > 0 &&
    !metadataAvatarRaw.startsWith('data:')
      ? metadataAvatarRaw
      : null;

  const fallbackProfile: ProfileRecord = {
    id: user.id,
    name: (user.user_metadata?.name as string | undefined) ?? null,
    email: user.email ?? null,
    avatar_url: metadataAvatar,
    created_at: user.created_at ?? null,
    notification_prefs: null
  };

  const profileData = profileResult.data as ProfileRecord | null;
  const profile: ProfileRecord = profileData
    ? {
        ...fallbackProfile,
        ...profileData,
        avatar_url: profileData.avatar_url ?? fallbackProfile.avatar_url
      }
    : fallbackProfile;
  const subscription = (subscriptionResult.data as SubscriptionRecord | null) ?? null;

  return (
    <main className="min-h-screen px-2 pb-16 pt-4 md:px-4 md:pt-6">
      <SettingsShell
        profile={profile}
        subscription={subscription}
        userEmail={user.email ?? ''}
      />
    </main>
  );
}
