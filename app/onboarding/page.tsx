import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export const metadata = { title: 'Get Started · StableGrid.io' };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has any existing activity — if so, skip onboarding
  const { data: progress } = await supabase
    .from('topic_progress')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  // Also check dashboard_layouts as another signal of returning user
  const { data: layout } = await supabase
    .from('dashboard_layouts')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const isReturningUser = Boolean(progress || layout);
  if (isReturningUser) {
    redirect('/');
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'there';

  return <OnboardingFlow displayName={displayName} />;
}
