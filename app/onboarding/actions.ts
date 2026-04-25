'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type CompleteOnboardingResult = { ok: true } | { ok: false; error: string };

export async function completeOnboarding(): Promise<CompleteOnboardingResult> {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  // Drop the RSC cache so the /onboarding gate re-evaluates with the new flag
  // on the next visit and doesn't bounce the user back into the flow.
  revalidatePath('/onboarding');

  return { ok: true };
}
