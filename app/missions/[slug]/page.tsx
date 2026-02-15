import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, Lock, ShieldAlert } from 'lucide-react';
import { MISSIONS, type MissionDifficulty } from '@/data/missions';

interface MissionDetailPageProps {
  params: {
    slug: string;
  };
}

const ACTS = [
  {
    title: 'Act 1 — The Alarm',
    duration: '10–15 min',
    description:
      'You enter the incident channel while telemetry and alerts are already escalating.'
  },
  {
    title: 'Act 2 — The Investigation',
    duration: '30–40 min',
    description:
      'You query operational data sources, isolate the anomaly, and validate root-cause.'
  },
  {
    title: 'Act 3 — The Fix',
    duration: '20–30 min',
    description:
      'You implement the production remediation and run strict validation checks.'
  },
  {
    title: 'Act 4 — The Debrief',
    duration: '10 min',
    description:
      'You publish an incident summary with measurable outcomes and residual risk.'
  }
];

const DIFFICULTY_STYLES: Record<MissionDifficulty, string> = {
  Medium:
    'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  Hard:
    'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  Expert:
    'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
};

export default function MissionDetailPage({ params }: MissionDetailPageProps) {
  const mission = MISSIONS.find((item) => item.slug === params.slug);
  if (!mission) {
    notFound();
  }

  const isPlayable = Boolean(mission.workspaceTaskId);

  return (
    <main className="min-h-screen bg-light-bg pb-20 pt-8 text-text-light-primary dark:bg-[#060b12] dark:text-[#dbe7f8]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <div className="flex items-center justify-between">
          <Link
            href="/missions"
            className="btn btn-secondary dark:border-[#2b3945] dark:bg-[#0d1a24] dark:text-[#c5d8ec] dark:hover:bg-[#122435]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Missions
          </Link>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${DIFFICULTY_STYLES[mission.difficulty]}`}
          >
            {mission.difficulty}
          </span>
        </div>

        <section className="rounded-2xl border border-light-border bg-white p-6 dark:border-[#1a2a34] dark:bg-[#08141d]">
          <h1 className="text-3xl font-semibold tracking-tight text-text-light-primary dark:text-[#f3f9ff]">
            {mission.codename}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-light-secondary dark:text-[#8ea6be]">
            <span>{mission.location}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-4 w-4" />
              {mission.duration}
            </span>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-text-light-secondary dark:text-[#9ab0c5]">
            {mission.summary}
          </p>

          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-400/25 dark:bg-[#111017]">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-rose-700 dark:text-rose-200">
              <ShieldAlert className="h-3.5 w-3.5" />
              Incident Stakes
            </p>
            <p className="mt-2 text-sm text-rose-700 dark:text-[#ffd4dc]">{mission.stakes}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {mission.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-light-border bg-light-surface px-2.5 py-1 text-xs text-text-light-secondary dark:border-[#2b4353] dark:bg-[#0f2230] dark:text-[#c7dced]"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-light-border bg-white p-6 dark:border-[#1a2a34] dark:bg-[#08141d]">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-[#f3f9ff]">Mission Flow</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {ACTS.map((act) => (
              <article
                key={act.title}
                className="rounded-lg border border-light-border bg-light-surface p-4 dark:border-[#233845] dark:bg-[#0d1b26]"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                  {act.duration}
                </p>
                <p className="mt-1 font-medium text-text-light-primary dark:text-[#f3f9ff]">
                  {act.title}
                </p>
                <p className="mt-2 text-sm text-text-light-secondary dark:text-[#89a2ba]">
                  {act.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-light-border bg-white p-6 dark:border-[#1a2a34] dark:bg-[#08141d]">
          <h2 className="text-xl font-semibold text-text-light-primary dark:text-[#f3f9ff]">Start Mission</h2>
          {isPlayable ? (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-text-light-secondary dark:text-[#9ab0c5]">
                This mission is available now. Launch workspace and begin Act 1.
              </p>
              <Link href={`/workspace/${mission.workspaceTaskId}`} className="btn btn-primary">
                Launch Mission
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-light-border bg-light-surface p-4 dark:border-[#2b3945] dark:bg-[#0d1a24]">
              <p className="text-sm text-text-light-secondary dark:text-[#9ab0c5]">
                Mission scenario page is ready. Interactive workspace is coming next.
              </p>
              <span className="inline-flex items-center gap-2 rounded-lg border border-light-border px-3 py-1.5 text-xs text-text-light-secondary dark:border-[#334a5d] dark:text-[#b8cbe0]">
                <Lock className="h-3.5 w-3.5" />
                Coming soon
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return MISSIONS.map((mission) => ({ slug: mission.slug }));
}

export function generateMetadata({ params }: MissionDetailPageProps): Metadata {
  const mission = MISSIONS.find((item) => item.slug === params.slug);
  if (!mission) {
    return {
      title: 'Mission Not Found | Gridlock',
      description: 'Mission detail page.'
    };
  }

  return {
    title: `${mission.codename} | Missions | Gridlock`,
    description: mission.summary
  };
}

