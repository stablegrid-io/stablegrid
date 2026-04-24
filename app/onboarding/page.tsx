import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export const metadata = { title: 'Get Started · stableGrid.io' };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Primary gate: explicit onboarding_completed flag on profiles (added by
  // 20260424000000_profiles_onboarding_flag.sql). The activity check below is
  // kept as an OR-fallback so users whose topic_progress/user_progress rows
  // were pruned before the backfill ran still skip the flow.
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect('/');
  }

  const { data: progress } = await supabase
    .from('topic_progress')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const { data: userProgress } = await supabase
    .from('user_progress')
    .select('xp,completed_questions')
    .eq('user_id', user.id)
    .maybeSingle();

  const hasPracticeActivity =
    Number(userProgress?.xp ?? 0) > 0 ||
    (Array.isArray(userProgress?.completed_questions) &&
      userProgress.completed_questions.length > 0);
  const isReturningUser = Boolean(progress || hasPracticeActivity);
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
