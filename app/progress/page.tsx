import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProfilePageShell } from '../profile/_components/ProfilePageShell';

export const metadata: Metadata = {
  title: 'Character — stableGrid.io',
  description: 'Your grid engineer identity, level, and deployed equipment.'
};

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: progressRow } = await supabase
    .from('user_progress')
    .select('xp, streak')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen px-2 pb-20 pt-4 md:px-4 md:pt-6">
      <ProfilePageShell
        serverXp={progressRow?.xp ?? 0}
        serverStreak={progressRow?.streak ?? 0}
      />
    </main>
  );
}
