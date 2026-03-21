import Link from 'next/link';
import Image from 'next/image';
import { MISSIONS } from '@/data/missions';
import { createClient } from '@/lib/supabase/server';

interface UserMissionRow {
  mission_slug: string;
  state: 'not_started' | 'in_progress' | 'completed';
}

export default async function OperationsMissionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const userMissions: UserMissionRow[] = user
    ? ((await supabase.from('user_missions').select('mission_slug,state').eq('user_id', user.id)).data ?? []) as UserMissionRow[]
    : [];

  const stateMap = new Map(userMissions.map((m) => [m.mission_slug, m.state]));
  const featured = MISSIONS[0];
  const queue = MISSIONS.slice(1);
  const featuredState = featured ? stateMap.get(featured.slug) ?? 'not_started' : 'not_started';

  return (
    <main className="relative flex flex-col" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Full-screen hero background */}
      <section className="absolute inset-0 z-0">
        {featured?.coverImage ? (
          <Image
            src={featured.coverImage}
            alt={featured.name}
            fill
            className="object-cover opacity-40 brightness-[0.4] grayscale-[0.2]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-surface-container-lowest" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </section>

      {/* Featured mission overlay */}
      {featured && (
        <div className="absolute inset-0 flex flex-col justify-end pb-24 px-8 lg:px-16 z-10">
          <div className="max-w-2xl">
            {/* OP code + threat */}
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-[9px] text-surface bg-primary px-2 py-0.5 font-bold tracking-widest">
                OP-001
              </span>
              <span className="font-mono text-[9px] text-error font-medium tracking-[0.3em] uppercase">
                THREAT: {featured.difficulty?.toUpperCase() ?? 'OMEGA'}
              </span>
            </div>

            {/* Big title */}
            <h1 className="font-headline font-black text-6xl lg:text-8xl text-on-surface uppercase tracking-tighter leading-[0.85] mb-6">
              {featured.name.split(' ').slice(0, -1).join(' ')}
              <br />
              <span className="text-on-surface/40">{featured.name.split(' ').pop()}</span>
            </h1>

            {/* Description */}
            <p className="text-on-surface/40 text-[11px] max-w-sm mb-10 leading-relaxed tracking-wider uppercase border-l border-primary/20 pl-4">
              {featured.briefing ?? featured.description ?? 'Classified mission briefing. Await further instructions.'}
            </p>

            {/* Stats + CTA */}
            <div className="flex gap-12 items-center">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between font-mono text-[8px] text-primary/40 uppercase tracking-widest">
                  <span>Sector Coverage</span>
                  <span className="ml-8">{featuredState === 'completed' ? '10' : featuredState === 'in_progress' ? '3' : '0'} / 10</span>
                </div>
                <div className="flex gap-[2px] h-[3px]">
                  {Array.from({ length: 10 }, (_, i) => {
                    const filled = featuredState === 'completed' ? 10 : featuredState === 'in_progress' ? 3 : 0;
                    return <div key={i} className={`w-6 ${i < filled ? 'bg-primary/80' : 'bg-white/5'}`} />;
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[8px] text-primary/40 uppercase tracking-widest">Window</span>
                <div className="text-xl font-headline font-bold text-on-surface tracking-widest">
                  {featured.durationMinutes ?? 42}:00:00
                  <span className="text-primary/40 text-[10px] ml-1">MS</span>
                </div>
              </div>
              <Link
                href={`/operations/missions/${featured.slug}`}
                className="bg-primary hover:shadow-[0_0_30px_rgba(153,247,255,0.4)] text-surface px-10 py-3 font-headline font-bold text-[11px] uppercase tracking-[0.3em] transition-all active:scale-95"
              >
                {featuredState === 'completed' ? 'Review' : featuredState === 'in_progress' ? 'Resume' : 'Engage'}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Right sidebar: Queue + System Logs */}
      <section className="absolute right-0 top-0 bottom-0 w-[300px] z-30 p-8 flex-col gap-6 bg-black/10 backdrop-blur-md border-l border-white/5 hidden lg:flex">
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h2 className="font-headline font-bold text-[10px] text-on-surface/40 uppercase tracking-[0.4em]">Queue</h2>
          <span className="font-mono text-[8px] text-primary/40 tracking-widest">ACTIVE_{String(queue.length).padStart(2, '0')}</span>
        </div>

        {/* Queue mission cards */}
        {queue.slice(0, 3).map((mission, index) => {
          const mState = stateMap.get(mission.slug) ?? 'not_started';
          const accentColor = index === 0 ? 'tertiary' : 'secondary';
          const filledBars = mState === 'completed' ? 4 : mState === 'in_progress' ? 2 : 0;

          return (
            <Link
              key={mission.slug}
              href={`/operations/missions/${mission.slug}`}
              className="group relative aspect-video border border-white/5 bg-white/[0.02] overflow-hidden hover:border-primary/30 transition-all duration-500"
            >
              {mission.coverImage && (
                <Image
                  src={mission.coverImage}
                  alt={mission.name}
                  fill
                  className="object-cover grayscale opacity-20 group-hover:opacity-40 transition-all duration-700"
                  unoptimized
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute top-3 right-3">
                <span className="font-mono text-[7px] text-on-surface/40 border border-white/10 px-2 py-0.5 uppercase">
                  OP-{String(index + 2).padStart(3, '0')}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="font-headline font-bold text-on-surface text-[10px] uppercase tracking-[0.2em] mb-1">
                  {mission.name}
                </h3>
                <div className="flex gap-[1px] h-[1.5px] w-12">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className={`flex-1 ${i < filledBars ? `bg-${accentColor}` : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            </Link>
          );
        })}

        {/* System Logs */}
        <div className="mt-auto border-t border-white/5 pt-4 font-mono text-[8px] tracking-[0.2em]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-on-surface/20 uppercase">System_Logs</span>
            <span className="text-primary/60 flex items-center gap-1">
              <span className="w-1 h-1 bg-primary animate-pulse" />
              FEED_LIVE
            </span>
          </div>
          <div className="space-y-2 uppercase">
            <div className="flex justify-between items-center border-l-2 border-primary/40 pl-3">
              <span className="text-on-surface/60">NODE_INIT</span>
              <span className="text-primary font-bold">READY</span>
            </div>
            <div className="flex justify-between items-center border-l-2 border-tertiary/40 pl-3">
              <span className="text-on-surface/60">LATENCY_S7</span>
              <span className="text-tertiary font-bold">WARN</span>
            </div>
            <div className="flex justify-between items-center border-l-2 border-primary/40 pl-3">
              <span className="text-on-surface/60">OMEGA_AUTH</span>
              <span className="text-primary font-bold">PASS</span>
            </div>
            <div className="flex justify-between items-center border-l-2 border-secondary/40 pl-3">
              <span className="text-on-surface/60">MESH_BRIDGE</span>
              <span className="text-secondary font-bold">SYNC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 lg:left-64 right-0 h-10 flex items-center justify-between px-8 bg-black/60 backdrop-blur-xl border-t border-white/5 z-50">
        <div className="flex gap-8 font-mono text-[8px] text-on-surface/30 uppercase tracking-[0.3em]">
          <span>GEO_POS: SECTOR_G7</span>
          <span>SIG-OMEGA-99</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[8px] text-primary/40 uppercase tracking-widest flex items-center gap-1">
            <span className="w-1 h-1 bg-primary/40" />
            SECURE_LINK
          </span>
        </div>
      </footer>
    </main>
  );
}
