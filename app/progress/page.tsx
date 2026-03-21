import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProgressDashboard } from './_components/ProgressDashboard';

export const metadata: Metadata = {
  title: 'Progress — stableGrid.io',
  description: 'Your learning metrics, grid performance, and infrastructure overview.'
};

export default async function ProgressPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: progressRow } = await supabase
    .from('user_progress')
    .select('xp, streak, completed_questions, topic_progress')
    .eq('user_id', user.id)
    .maybeSingle();

  const topicProgress = (progressRow?.topic_progress ?? {}) as Record<
    string,
    { correct?: number; total?: number }
  >;

  return (
    <main className="min-h-screen bg-[#060809] px-4 pb-20 pt-6 md:px-6 md:pt-8">
      <ProgressDashboard
        serverXp={progressRow?.xp ?? 0}
        serverStreak={progressRow?.streak ?? 0}
        serverQuestionsCompleted={progressRow?.completed_questions?.length ?? 0}
        serverTopicProgress={{
          pyspark: {
            correct: topicProgress.pyspark?.correct ?? 0,
            total: topicProgress.pyspark?.total ?? 0
          },
          fabric: {
            correct: topicProgress.fabric?.correct ?? 0,
            total: topicProgress.fabric?.total ?? 0
          }
        }}
      />
    </main>
  );
}
