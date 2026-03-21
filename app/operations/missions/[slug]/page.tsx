import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MISSIONS } from '@/data/missions';

export default function MissionPage({ params }: { params: { slug: string } }) {
  const mission = MISSIONS.find((m) => m.slug === params.slug);
  if (!mission) notFound();

  const bgImage = mission.coverImage ?? '/grid-assets/missions/blackout-berlin-bg.jpg';

  return (
    <div className="relative flex flex-col overflow-hidden bg-black" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
      {/* Background image */}
      <div className="fixed inset-0 z-0">
        <Image src={bgImage} alt={mission.codename} fill className="object-cover grayscale opacity-40 scale-110" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 grid-overlay opacity-30" />
      </div>

      {/* HUD corner brackets */}
      <div className="fixed top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-primary/20 pointer-events-none z-20 lg:left-[17.5rem]" />
      <div className="fixed top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-primary/20 pointer-events-none z-20" />
      <div className="fixed bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-primary/20 pointer-events-none z-20 lg:left-[17.5rem]" />
      <div className="fixed bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-primary/20 pointer-events-none z-20" />

      <div className="relative z-10 h-full flex-1 p-6 lg:p-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1 bg-primary shadow-[0_0_15px_#99f7ff]" />
              <div>
                <div className="text-[9px] font-mono tracking-[0.3em] text-primary uppercase opacity-70">NEURAL COMMAND // MISSION ASSET</div>
                <h1 className="text-4xl lg:text-6xl font-black font-headline tracking-tighter italic uppercase text-on-surface">{mission.codename}</h1>
              </div>
            </div>
            <div className="flex gap-3 ml-4 mt-2">
              <div className="px-3 py-1 bg-error/20 border border-error/40 text-error font-mono text-[10px] tracking-widest uppercase">
                Status: {mission.difficulty}
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 text-on-surface-variant font-mono text-[10px] tracking-widest uppercase italic">
                LOC: {mission.location}
              </div>
            </div>
          </div>
          <Link href="/operations/missions" className="font-mono text-[10px] text-primary/60 hover:text-primary transition-colors uppercase tracking-widest border border-primary/20 px-3 py-1.5">
            ← BACK
          </Link>
        </div>

        {/* Center: AUTHORIZE */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative group">
            <div className="absolute inset-0 -m-8 border border-primary/10 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-0 -m-16 border border-primary/5 rounded-full animate-[spin_30s_linear_infinite_reverse]" />
            <button className="relative w-56 h-56 lg:w-64 lg:h-64 flex flex-col items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 shadow-[0_0_60px_rgba(0,242,255,0.2)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_80px_rgba(0,242,255,0.4)] active:scale-95">
              <div className="absolute inset-2 border-2 border-white/20 rounded-full" />
              <span className="text-4xl mb-2">🔐</span>
              <span className="font-headline font-black text-lg tracking-[0.2em] uppercase text-on-surface">AUTHORIZE</span>
              <span className="font-mono text-[8px] mt-1 text-on-surface/70 tracking-widest uppercase">BEGIN INVESTIGATION</span>
              <div className="absolute top-1/2 -translate-y-1/2 -left-8 w-5 h-[1px] bg-primary" />
              <div className="absolute top-1/2 -translate-y-1/2 -right-8 w-5 h-[1px] bg-primary" />
            </button>
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-end">
          {/* Intel */}
          <div className="glass-panel border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <span className="text-primary text-sm">📡</span>
              <h3 className="font-headline font-bold text-[10px] tracking-widest uppercase">MISSION_CRITICAL_INTEL</h3>
            </div>
            <p className="text-[10px] leading-relaxed text-on-surface-variant italic mb-3">{mission.summary}</p>
            <div className="flex flex-wrap gap-1">
              {mission.skills.map((s) => (
                <span key={s} className="font-mono text-[7px] text-primary/70 border border-primary/20 px-1.5 py-0.5 uppercase">{s}</span>
              ))}
            </div>
          </div>

          {/* Center status */}
          <div className="flex flex-col items-center gap-2">
            <div className="glass-panel px-4 py-2 flex gap-5 items-center border border-primary/30">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary animate-pulse" />
                <span className="font-mono text-[9px] tracking-widest opacity-80 uppercase">Uplink: OK</span>
              </div>
              <div className="h-3 w-[1px] bg-white/20" />
              <span className="font-mono text-[9px] tracking-widest text-primary uppercase">SYNC: 98.4%</span>
            </div>
            <div className="text-[7px] font-mono tracking-[0.3em] text-on-surface-variant/30 uppercase">Neural Command Terminal</div>
          </div>

          {/* Alerts */}
          <div className="glass-panel border border-white/10 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-headline font-bold text-[10px] tracking-widest uppercase">ACTIVE_ALERTS</h3>
              <span className="font-mono text-[9px] text-error">! PRIORITY</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-error/5 border-l-2 border-error/50">
                <span className="text-error text-xs">⚠</span>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-tighter">{mission.stakes.split('.')[0]}</div>
                  <div className="text-[7px] font-mono text-on-surface-variant uppercase">Critical</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-tertiary/5 border-l-2 border-tertiary/50">
                <span className="text-tertiary text-xs">⚡</span>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-tighter">XP: {mission.xp.toLocaleString()}</div>
                  <div className="text-[7px] font-mono text-on-surface-variant uppercase">{mission.duration}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ slug: m.slug }));
}
