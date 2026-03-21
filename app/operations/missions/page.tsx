import Link from 'next/link';
import { Clock } from 'lucide-react';
import { MISSIONS } from '@/data/missions';
import { createClient } from '@/lib/supabase/server';

interface UserMissionRow {
  mission_slug: string;
  state: 'not_started' | 'in_progress' | 'completed';
}

const DIFFICULTY_ACCENT: Record<string, { color: string; rgb: string }> = {
  hard: { color: '#ff716c', rgb: '255,113,108' },
  medium: { color: '#ffc965', rgb: '255,201,101' },
  easy: { color: '#bf81ff', rgb: '191,129,255' },
};

export default async function OperationsMissionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userMissions: UserMissionRow[] = user
    ? ((await supabase
        .from('user_missions')
        .select('mission_slug,state')
        .eq('user_id', user.id)).data ?? []) as UserMissionRow[]
    : [];

  const missionStateMap = new Map(userMissions.map((m) => [m.mission_slug, m.state]));
  const completedCount = userMissions.filter((m) => m.state === 'completed').length;

  return (
    <main className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-outline-variant/10 pb-4">
          <div>
            <h1 className="font-headline font-bold text-2xl tracking-tight text-primary uppercase">Mission Control</h1>
            <p className="font-mono text-[10px] text-on-surface-variant tracking-[0.2em] uppercase mt-1">
              Status: Active Deployments // Clearance: OMEGA
            </p>
          </div>
          <div className="hidden lg:flex gap-8 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-on-surface-variant uppercase text-[8px] mb-1">Active Assets</span>
              <span className="text-primary font-bold">{completedCount}/{MISSIONS.length}</span>
            </div>
          </div>
        </div>

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MISSIONS.map((mission, index) => {
            const state = missionStateMap.get(mission.slug) ?? 'not_started';
            const isCompleted = state === 'completed';
            const isInProgress = state === 'in_progress';
            const difficulty = (mission.difficulty ?? 'medium').toLowerCase();
            const accent = DIFFICULTY_ACCENT[difficulty] ?? DIFFICULTY_ACCENT.medium;
            const opCode = `OP-${String(index + 1).padStart(3, '0')}`;
            const progressFilled = isCompleted ? 8 : isInProgress ? 3 : 0;
            const segments = 8;

            return (
              <Link
                key={mission.slug}
                href={`/operations/missions/${mission.slug}`}
                className="group relative bg-surface-container-low border border-outline-variant/15 hover:border-primary/40 transition-all duration-300"
              >
                {/* L-bracket corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 transition-colors" style={{ borderColor: `rgba(${accent.rgb},0.2)` }} />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 transition-colors" style={{ borderColor: `rgba(${accent.rgb},0.2)` }} />

                <div className="p-6">
                  {/* OP code + difficulty */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-mono text-[10px] px-2 py-0.5 border" style={{ color: accent.color, backgroundColor: `rgba(${accent.rgb},0.1)`, borderColor: `rgba(${accent.rgb},0.2)` }}>
                      {opCode}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5" style={{ backgroundColor: accent.color }} />
                      <span className="font-mono text-[9px] uppercase" style={{ color: accent.color }}>
                        {difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Title + description */}
                  <div className="mb-4">
                    <h3 className="font-headline font-bold text-xl uppercase tracking-tighter text-on-surface">
                      {mission.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-2 line-clamp-2 font-body">
                      {mission.briefing ?? mission.description ?? 'Classified mission briefing.'}
                    </p>
                  </div>

                  {/* Segmented progress */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between font-mono text-[10px] text-on-surface-variant uppercase">
                      <span>Objective Coverage</span>
                      <span style={{ color: accent.color }}>
                        {isCompleted ? 'COMPLETE' : isInProgress ? 'IN PROGRESS' : 'READY'}
                      </span>
                    </div>
                    <div className="flex gap-1 h-2">
                      {Array.from({ length: segments }, (_, i) => (
                        <div
                          key={i}
                          className="flex-1 border"
                          style={{
                            backgroundColor: i < progressFilled ? accent.color : 'transparent',
                            borderColor: i < progressFilled ? `rgba(${accent.rgb},0.4)` : 'rgba(70,72,74,0.1)'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      EST: {mission.durationMinutes ?? 30}:00M
                    </div>
                    <span
                      className="px-4 py-1.5 font-headline font-bold text-xs uppercase border transition-all active:scale-95"
                      style={{
                        color: accent.color,
                        backgroundColor: `rgba(${accent.rgb},0.1)`,
                        borderColor: `rgba(${accent.rgb},0.3)`
                      }}
                    >
                      {isCompleted ? 'Review' : isInProgress ? 'Resume' : 'Initialize'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-outline-variant/10 flex justify-between items-center font-mono text-[9px] text-on-surface-variant uppercase tracking-widest">
          <span>NEURAL_ID: OPERATOR-01</span>
          <span className="text-primary">stableGrid Systems</span>
        </footer>
      </div>
    </main>
  );
}
