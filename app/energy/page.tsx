'use client';

import Link from 'next/link';
import { memo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { PulseCompanionOverlay } from '@/components/mascot/PulseCompanionOverlay';
import { GridRestorationMap } from '@/components/energy/GridRestorationMap';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import { usePulseMascotStore } from '@/lib/stores/usePulseMascotStore';
import { unitsToKwh } from '@/lib/energy';

const PULSE_MODEL_URL = process.env.NEXT_PUBLIC_PULSE_MODEL_URL;

function buildWavePath(t: number, width = 280, height = 40) {
  const points: string[] = [];
  const steps = 80;

  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width;
    const phase = (i / steps) * Math.PI * 6 + t;
    let y = Math.sin(phase) * 10;
    y += Math.sin(phase * 2.1 + 0.3) * 2.5;
    y += Math.sin(phase * 0.5 + t * 0.3) * 1.5;

    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(height / 2 - y).toFixed(1)}`);
  }

  return points.join(' ');
}

const FrequencyMonitor = memo(function FrequencyMonitor() {
  const path = buildWavePath(0.25, 280, 40);

  return (
    <div className="flex items-center gap-3">
      <svg width={280} height={40} className="overflow-visible">
        <line
          x1={0}
          y1={20}
          x2={280}
          y2={20}
          className="stroke-light-border dark:stroke-emerald-900/50"
          strokeWidth={1}
          strokeDasharray="3 6"
        />
        <path d={path} fill="none" stroke="#10b981" strokeWidth={1.6} strokeLinecap="round" />
      </svg>
      <div className="shrink-0 text-right">
        <div className="font-mono text-xs font-extrabold text-emerald-500">50.000 Hz</div>
        <div className="mt-0.5 text-[9px] font-bold tracking-[0.12em] text-text-light-tertiary dark:text-text-dark-tertiary">
          GRID FREQ
        </div>
      </div>
    </div>
  );
});

export default function EnergyLabPage() {
  const totalUnits = useProgressStore((state) => state.xp);
  const pulseMood = usePulseMascotStore((state) => state.mood);
  const pulseMotion = usePulseMascotStore((state) => state.motion);
  const pulseBaseAction = usePulseMascotStore((state) => state.action);

  const lifetimeKwh = unitsToKwh(totalUnits);

  return (
    <main className="min-h-screen bg-light-bg px-4 pb-12 pt-8 dark:bg-dark-bg sm:px-6">
      <PulseCompanionOverlay
        mood={pulseMood}
        motion={pulseMotion}
        action={pulseBaseAction}
        size={170}
        modelUrl={PULSE_MODEL_URL}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <section className="sticky top-16 z-20 rounded-xl border border-light-border bg-white/90 px-4 py-2.5 backdrop-blur dark:border-dark-border dark:bg-dark-surface/90">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-500">
              Energy Lab · Project Rebuild
            </p>
            <FrequencyMonitor />
            <Link href="/" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" />
              Back Home
            </Link>
          </div>
        </section>

        <header className="mt-2">
          <p className="data-mono text-xs uppercase tracking-[0.35em] text-emerald-500/80">Energy Lab</p>
          <h1 className="mt-2 text-4xl font-semibold text-text-light-primary dark:text-text-dark-primary md:text-5xl font-display">
            Your Grid
          </h1>
          <p className="mt-1 text-sm text-text-light-secondary dark:text-text-dark-secondary md:text-base">
            Generated energy from flashcards, missions, and chapter completions.
          </p>
        </header>

        <section>
          <GridRestorationMap kwh={lifetimeKwh} ghostActive={false} />
        </section>
      </div>
    </main>
  );
}
