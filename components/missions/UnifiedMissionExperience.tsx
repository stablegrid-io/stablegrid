'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Play, Terminal } from 'lucide-react';
import { createMissionProgressRequestKey } from '@/lib/api/requestKeys';
import { useProgressStore } from '@/lib/stores/useProgressStore';
import type { MissionState } from '@/types/missions';
import type { MissionDefinition } from '@/data/missions';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';

const ACTS = [
  { id: 0, label: 'The Alarm', icon: '🚨' },
  { id: 1, label: 'The Investigation', icon: '🔍' },
  { id: 2, label: 'The Fix', icon: '⚡' },
  { id: 3, label: 'The Report', icon: '📋' }
] as const;

interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  hint: string;
  solution: string;
  output: string;
  reward: number;
  passKeywords: string[];
  reaction: string;
}

function FrequencyLine({ danger }: { danger: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      setPhase((value) => value + 0.05);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const width = 260;
  const height = 50;
  const points: string[] = [];
  for (let i = 0; i <= 90; i += 1) {
    const x = (i / 90) * width;
    const p = (i / 90) * Math.PI * 5 + phase;
    let y = Math.sin(p) * 8 + Math.sin(p * 1.7) * 2;
    if (danger && i > 40 && i < 60) {
      y += Math.sin(i * 2.6 + phase * 5) * 7;
    }
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(height / 2 - y).toFixed(1)}`);
  }

  return (
    <svg width={width} height={height} className="w-full max-w-[260px]">
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="currentColor"
        className="opacity-30"
        strokeDasharray="4 8"
      />
      <path
        d={points.join(' ')}
        fill="none"
        stroke={danger ? '#ef4444' : '#2563eb'}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </svg>
  );
}

function TaskEditor({
  task,
  done,
  onSolved
}: {
  task: TaskDefinition;
  done: boolean;
  onSolved: () => void;
}) {
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const run = () => {
    if (running || done || code.trim().length === 0) {
      return;
    }

    setRunning(true);
    setResult(null);

    window.setTimeout(() => {
      const normalized = code.toLowerCase();
      const solved = task.passKeywords.some((keyword) => normalized.includes(keyword));
      setRunning(false);
      if (solved) {
        setResult({ ok: true, text: task.output });
        onSolved();
      } else {
        setResult({
          ok: false,
          text: 'AnalysisException: query validated but expected pattern is missing. Re-check grouping/window logic.'
        });
      }
    }, 900);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          pyspark_shell.py
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCode(task.solution)}
            className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
          >
            Show Solution
          </button>
        </div>
      </div>

      <textarea
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder={task.hint}
        className="min-h-[180px] w-full resize-y border-0 bg-slate-950 px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 outline-none"
      />

      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <button
          type="button"
          onClick={run}
          disabled={done || running}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {done ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {done ? 'Validated' : running ? 'Running…' : 'Run Query'}
        </button>
        <span className="text-xs text-slate-500 dark:text-slate-400">+{task.reward} kWh on first pass</span>
      </div>

      {result ? (
        <div className="border-t border-slate-200 bg-slate-950 px-4 py-3 dark:border-slate-800">
          <pre
            className={`overflow-x-auto whitespace-pre-wrap text-xs leading-6 ${
              result.ok ? 'text-brand-300' : 'text-rose-300'
            }`}
          >
            {result.text}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function UnifiedMissionExperience({ mission }: { mission: MissionDefinition }) {
  const addXP = useProgressStore((state) => state.addXP);

  const [act, setAct] = useState(0);
  const [sessionEnergy, setSessionEnergy] = useState(0);
  const [investigationIndex, setInvestigationIndex] = useState(0);
  const [investigationDone, setInvestigationDone] = useState([false, false]);
  const [fixDone, setFixDone] = useState(false);
  const [reportAnswer, setReportAnswer] = useState<string | null>(null);
  const [missionComplete, setMissionComplete] = useState(false);

  const completionPersistedRef = useRef(false);

  const investigationTasks = useMemo<TaskDefinition[]>(
    () => [
      {
        id: 'baseline',
        title: `Task 1 — Baseline ${mission.location} anomaly profile`,
        description:
          'Build a grouped baseline around the incident window and identify the highest-risk segment before remediation.',
        hint: `# ${mission.codename}\n# Build grouped profile by 3-minute window\n# Return zone + count + anomaly flag`,
        solution: `df = spark.read.table("grid.telemetry")\nsummary = df.groupBy("zone_id").count().orderBy("count", ascending=False)\nsummary.show(10)`,
        output: `+---------+-------+\n|zone_id  |count  |\n+---------+-------+\n|ZONE-04  |128004 |\n|ZONE-09  |117332 |\n+---------+-------+\nAnomaly corridor isolated for ${mission.location}.`,
        reward: 180,
        passKeywords: ['groupby', 'count', 'orderby'],
        reaction:
          'Good. Baseline is clean enough to isolate the failure corridor. Proceed to sequence validation.'
      },
      {
        id: 'sequence',
        title: 'Task 2 — Validate event ordering sequence',
        description:
          'Use a window check to confirm arrival/event timestamp inversion and quantify delayed replay impact.',
        hint: `# Use lag() over event arrival order\n# Flag rows where event_ts regresses against previous record`,
        solution: `from pyspark.sql.window import Window\nfrom pyspark.sql.functions import lag\n\nw = Window.partitionBy("zone_id").orderBy("arrival_ts")\ndf = spark.read.table("grid.events")\nres = df.withColumn("prev_ts", lag("event_ts").over(w)).filter(col("event_ts") < col("prev_ts"))\nres.show(20)`,
        output: `+---------+-------------------+-------------------+\n|zone_id  |event_ts           |arrival_ts         |\n+---------+-------------------+-------------------+\n|ZONE-04  |2026-02-16 02:14:33|2026-02-16 02:18:02|\n+---------+-------------------+-------------------+\nOut-of-order pattern confirmed and bounded.`,
        reward: 220,
        passKeywords: ['lag', 'window', 'filter'],
        reaction:
          'Sequence inversion confirmed. Root-cause path is now defensible for engineering and leadership.'
      }
    ],
    [mission.codename, mission.location]
  );

  const fixTask = useMemo<TaskDefinition>(
    () => ({
      id: 'fix',
      title: 'Task 3 — Implement remediation guardrail',
      description:
        'Write the remediation query/update that enforces stability constraints without corrupting downstream observability.',
      hint: `# Implement production-safe remediation\n# Include explicit quality gate column`,
      solution: `clean = source.filter(col("quality_flag") == lit("ok"))\nclean = clean.withColumn("status", lit("validated"))\nclean.write.format("delta").mode("append").saveAsTable("grid.remediated_events")`,
      output: `Remediation applied to ${mission.location}.\nValidation gate attached.\nDownstream consumers receiving stable records.`,
      reward: mission.difficulty === 'Expert' ? 420 : 320,
      passKeywords: ['filter', 'withcolumn', 'write'],
      reaction:
        'Fix validated. You can now publish the incident classification with evidence.'
    }),
    [mission.difficulty, mission.location]
  );

  const postMissionState = useCallback(async (state: MissionState) => {
    try {
      const response = await fetch('/api/missions/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': createMissionProgressRequestKey({
            missionSlug: mission.slug,
            state,
            unlocked: true
          })
        },
        body: JSON.stringify({ missionSlug: mission.slug, state, unlocked: true })
      });

      if (!response.ok) return 0;
      if (state !== 'completed') return 0;
      const payload = (await response.json()) as { reward_awarded_units?: number };
      return Number(payload.reward_awarded_units ?? 0);
    } catch {
      return 0;
    }
  }, [mission.slug]);

  useEffect(() => {
    void postMissionState('in_progress');
  }, [postMissionState]);

  const award = (units: number) => {
    setSessionEnergy((value) => value + units);
  };

  const markInvestigationDone = (index: number) => {
    setInvestigationDone((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
    award(investigationTasks[index].reward);
  };

  const markFixDone = () => {
    if (fixDone) return;
    setFixDone(true);
    award(fixTask.reward);
  };

  const completeMission = useCallback(async () => {
    if (completionPersistedRef.current) return;
    completionPersistedRef.current = true;
    const rewardUnits = await postMissionState('completed');
    if (rewardUnits > 0) {
      addXP(rewardUnits, {
        source: 'mission',
        label: `Mission complete: ${mission.codename}`
      });
    }
  }, [addXP, mission.codename, postMissionState]);

  const onReport = (value: string) => {
    if (missionComplete) return;
    setReportAnswer(value);
    if (value === 'b') {
      setMissionComplete(true);
      award(500);
      void completeMission();
    }
  };

  const currentTask = investigationTasks[investigationIndex];
  const currentTaskDone = investigationDone[investigationIndex];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link
            href="/missions"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Exit Mission
          </Link>

          <div className="ml-2 flex items-center gap-1">
            {ACTS.map((entry) => {
              const done =
                (entry.id === 0 && true) ||
                (entry.id === 1 && investigationDone.every(Boolean)) ||
                (entry.id === 2 && fixDone) ||
                (entry.id === 3 && missionComplete);
              const locked =
                (entry.id === 2 && !investigationDone.every(Boolean)) ||
                (entry.id === 3 && !fixDone);

              return (
                <button
                  key={entry.id}
                  type="button"
                  disabled={locked}
                  onClick={() => setAct(entry.id)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    act === entry.id
                      ? 'bg-blue-600 text-white'
                      : done
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                        : 'text-slate-500 dark:text-slate-400'
                  } ${locked ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {entry.icon}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-slate-500 dark:text-slate-400 md:block">
              <FrequencyLine danger={act === 1 || act === 2} />
            </div>
            <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-rose-700 dark:border-rose-600/50 dark:bg-rose-900/30 dark:text-rose-300">
              Mission active
            </span>
            <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-600/50 dark:bg-blue-900/30 dark:text-blue-300">
              +{sessionEnergy} kWh
            </span>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-6xl px-4 py-7">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
            <span className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-300">
              Classified
            </span>
            <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-300">
              {mission.difficulty} · {mission.duration}
            </span>
            <span className="text-slate-500 dark:text-slate-400">{mission.location}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">{mission.codename}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {ACTS[act].icon} Act {act + 1} — {ACTS[act].label}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-7">
        {act === 0 ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                # incident-{mission.slug}
              </div>
              <div className="space-y-3 p-4">
                {[
                  {
                    role: 'GridOS Ops',
                    text: `Critical signal instability detected in ${mission.location}. ${mission.stakes}`,
                    tone: 'ops'
                  },
                  {
                    role: 'Lena Kovač',
                    text: `You are assigned to ${mission.codename}. Establish evidence chain before remediation.`,
                    tone: 'lead'
                  },
                  {
                    role: 'Mario Bauer',
                    text: 'Ops confirms this is reproducible. Keep every query auditable.',
                    tone: 'ops'
                  },
                  {
                    role: 'Sara Okonkwo',
                    text: `Focus areas: ${mission.skills.join(', ')}. I shared schema in attachments.`,
                    tone: 'analysis'
                  }
                ].map((line, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{line.role}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-300">{line.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-700/50 dark:bg-rose-950/30">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-700 dark:text-rose-300">Active alerts</p>
                <ul className="mt-3 space-y-2 text-sm text-rose-700 dark:text-rose-200">
                  <li>• Primary deviation channel armed</li>
                  <li>• Telemetry reliability under review</li>
                  <li>• Incident command awaiting report</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Frequency snapshot</p>
                <div className="mt-2 text-slate-500 dark:text-slate-400">
                  <FrequencyLine danger />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAct(1)}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Begin Investigation →
              </button>
            </div>
          </div>
        ) : null}

        {act === 1 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-blue-600 dark:text-blue-300">Lena Kovač:</span> Confirm anomaly profile first, then validate sequence inversion. Keep output concise and reproducible.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
                    {currentTask.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{currentTask.description}</p>
                </div>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Task {investigationIndex + 1} / {investigationTasks.length}
                </span>
              </div>

              <TaskEditor
                key={currentTask.id}
                task={currentTask}
                done={currentTaskDone}
                onSolved={() => markInvestigationDone(investigationIndex)}
              />

              {currentTaskDone ? (
                <p className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-700/50 dark:bg-brand-900/20 dark:text-brand-300">
                  {currentTask.reaction}
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  disabled={investigationIndex === 0}
                  onClick={() => setInvestigationIndex((value) => Math.max(0, value - 1))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                >
                  Previous task
                </button>
                <button
                  type="button"
                  disabled={investigationIndex >= investigationTasks.length - 1 || !currentTaskDone}
                  onClick={() =>
                    setInvestigationIndex((value) =>
                      Math.min(investigationTasks.length - 1, value + 1)
                    )
                  }
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next task
                </button>
              </div>
            </div>

            {investigationDone.every(Boolean) ? (
              <button
                type="button"
                onClick={() => setAct(2)}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Proceed to The Fix →
              </button>
            ) : null}
          </div>
        ) : null}

        {act === 2 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-rose-600 dark:text-rose-300">Mission command:</span> Apply the remediation with explicit quality controls and prove downstream stability.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
                {fixTask.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{fixTask.description}</p>
              <div className="mt-4">
                <TaskEditor task={fixTask} done={fixDone} onSolved={markFixDone} />
              </div>
              {fixDone ? (
                <p className="mt-3 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-800 dark:border-brand-700/50 dark:bg-brand-900/20 dark:text-brand-300">
                  {fixTask.reaction}
                </p>
              ) : null}
            </div>

            {fixDone ? (
              <button
                type="button"
                onClick={() => setAct(3)}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500"
              >
                Write Incident Report →
              </button>
            ) : null}
          </div>
        ) : null}

        {act === 3 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Incident classification
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                Select the most defensible classification using the evidence chain you produced.
              </p>

              <div className="mt-4 space-y-2">
                {[
                  {
                    id: 'a',
                    text: 'Transient hardware instability with no systemic control impact.'
                  },
                  {
                    id: 'b',
                    text: 'Deterministic control-path issue with data integrity side-effects requiring permanent guardrails.'
                  },
                  {
                    id: 'c',
                    text: 'Logging delay only; no operational remediation needed.'
                  }
                ].map((option) => {
                  const selected = reportAnswer === option.id;
                  const correct = option.id === 'b';
                  const revealed = reportAnswer !== null;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onReport(option.id)}
                      disabled={missionComplete}
                      className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                        revealed && correct
                          ? 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-700/50 dark:bg-brand-900/20 dark:text-brand-300'
                          : revealed && selected && !correct
                            ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700/50 dark:bg-rose-900/20 dark:text-rose-300'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700/70'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {missionComplete ? (
              <div className="rounded-2xl border border-brand-300 bg-brand-50 p-5 dark:border-brand-700/50 dark:bg-brand-900/20">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-300">
                  Mission complete
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {mission.codename} resolved
                </h2>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  Evidence accepted. Remediation shipped. Incident moved to monitoring.
                </p>

                <div className="mt-4 rounded-xl border border-brand-200 bg-white/75 p-3 dark:border-brand-700/40 dark:bg-brand-950/20">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Mission stabilization confirmed
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Grid waveform telemetry is now synced with your completion profile.
                  </p>
                </div>

                <LightbulbPulseFeedback
                  className="mt-4 border-brand-300/40 dark:border-brand-600/40 dark:bg-brand-950/10"
                  contextType="mission"
                  contextId={mission.slug}
                  prompt="How was this mission?"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
