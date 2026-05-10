'use client';

/**
 * Dev preview for completion / reward toasts. Visit /dev/toasts directly.
 * Not linked from the nav. Safe to delete after design review.
 */

import { useEffect, useState } from 'react';
import {
  KWhRewardToast,
  type KWhReward,
} from '@/components/learn/theory/KWhRewardToast';
import { LessonCompletionToast } from '@/components/learn/theory/LessonCompletionToast';
import { SessionStartedToast } from '@/components/learn/theory/SessionStartedToast';
import { SessionEndedToast } from '@/components/learn/theory/SessionEndedToast';
import { ModuleCompleteFeedback } from '@/components/feedback/ModuleCompleteFeedback';
import { PracticeSetCompleteFeedback } from '@/components/feedback/PracticeSetCompleteFeedback';
import { TrackCompleteFeedback } from '@/components/feedback/TrackCompleteFeedback';

type ActiveKind =
  | 'kwh-lesson'
  | 'kwh-track-junior'
  | 'kwh-track-mid'
  | 'kwh-track-senior'
  | 'lesson-completion-mid'
  | 'lesson-completion-finale'
  | 'session-started-pomodoro'
  | 'session-started-free'
  | 'session-ended-on-time'
  | 'session-ended-overrun'
  | 'feedback-module-complete'
  | 'feedback-practice-set-cleared'
  | 'feedback-practice-set-partial'
  | 'feedback-track-complete-junior'
  | 'feedback-track-complete-mid'
  | 'feedback-track-complete-senior'
  | null;

const KWH_REWARDS: Record<
  'lesson' | 'trackJunior' | 'trackMid' | 'trackSenior',
  KWhReward
> = {
  lesson: {
    id: 'kwh-preview-lesson',
    tier: 'lesson',
    kwh: 12,
    label: 'Why Spark Exists',
  },
  // Track-level rewards. The TrackToast keys its multiplier off `trackLevel`
  // (junior 1.0× / mid 1.5× / senior 3.0×), so we preview all three to verify
  // the eyebrow + multiplier + final-track copy render correctly.
  trackJunior: {
    id: 'kwh-preview-track-junior',
    tier: 'track',
    kwh: 320,
    label: 'Junior — Core Foundation',
    trackLevel: 'junior',
  },
  trackMid: {
    id: 'kwh-preview-track-mid',
    tier: 'track',
    kwh: 720,
    label: 'Mid — Advanced Transformations',
    trackLevel: 'mid',
  },
  trackSenior: {
    id: 'kwh-preview-track-senior',
    tier: 'track',
    kwh: 1450,
    label: 'Senior — Cluster Tuning',
    trackLevel: 'senior',
  },
};

interface Trigger {
  id: ActiveKind;
  label: string;
  group: string;
  /** Where on screen the toast actually renders. */
  position: string;
  /** Auto-dismiss timer baked into the toast component. */
  duration: string;
}

const TRIGGERS: Trigger[] = [
  {
    id: 'kwh-lesson',
    label: 'Lesson kWh reward',
    group: 'kWh Reward',
    position: 'Bottom-right corner (small chip)',
    duration: '2.5s',
  },
  {
    id: 'kwh-track-junior',
    label: 'Junior track complete',
    group: 'kWh Reward',
    position: 'Center · full-screen scrim + card',
    duration: '8s',
  },
  {
    id: 'kwh-track-mid',
    label: 'Mid track complete',
    group: 'kWh Reward',
    position: 'Center · full-screen scrim + card',
    duration: '8s',
  },
  {
    id: 'kwh-track-senior',
    label: 'Senior track complete (final)',
    group: 'kWh Reward',
    position: 'Center · full-screen scrim + card',
    duration: '8s',
  },
  {
    id: 'lesson-completion-mid',
    label: 'Module complete · mid-track',
    group: 'Module Completion',
    position: 'Bottom-center bar',
    duration: '8s',
  },
  {
    id: 'lesson-completion-finale',
    label: 'Module complete · final module',
    group: 'Module Completion',
    position: 'Bottom-center bar',
    duration: '8s',
  },
  {
    id: 'session-started-pomodoro',
    label: 'Session started · Pomodoro',
    group: 'Session lifecycle',
    position: 'Center · floating banner',
    duration: '4s',
  },
  {
    id: 'session-started-free',
    label: 'Session started · Free read',
    group: 'Session lifecycle',
    position: 'Center · floating banner',
    duration: '4s',
  },
  {
    id: 'session-ended-on-time',
    label: 'Session ended · finished on time',
    group: 'Session lifecycle',
    position: 'Center · floating banner',
    duration: '4s',
  },
  {
    id: 'session-ended-overrun',
    label: 'Session ended · early exit',
    group: 'Session lifecycle',
    position: 'Center · floating banner',
    duration: '4s',
  },
  {
    id: 'feedback-module-complete',
    label: 'Module-complete rating (1–5)',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
  {
    id: 'feedback-practice-set-cleared',
    label: 'Practice set complete · all tasks solved',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
  {
    id: 'feedback-practice-set-partial',
    label: 'Practice set complete · partial run',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
  {
    id: 'feedback-track-complete-junior',
    label: 'Track complete · Junior',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
  {
    id: 'feedback-track-complete-mid',
    label: 'Track complete · Mid',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
  {
    id: 'feedback-track-complete-senior',
    label: 'Track complete · Senior',
    group: 'Feedback',
    position: 'Inline · centered card',
    duration: 'Persistent until dismissed',
  },
];

// Storage keys the feedback components write to. The dev preview lets you
// reset them so you can re-test the unsubmitted state without juggling
// devtools.
const FEEDBACK_STORAGE_KEYS = [
  'stablegrid-module-feedback:pyspark:preview-module-1',
  'stablegrid-practice-set-feedback:pyspark:module-PS3',
  'stablegrid-practice-set-feedback:pyspark:module-FND-AGGREGATIONS-JUNIOR',
  'stablegrid-track-feedback:pyspark:junior',
  'stablegrid-track-feedback:pyspark:mid',
  'stablegrid-track-feedback:pyspark:senior',
];

export default function ToastPreviewPage() {
  const [active, setActive] = useState<ActiveKind>(null);
  const [keepAlive, setKeepAlive] = useState(false);
  const [tick, setTick] = useState(0);

  // Force-remount the toast each time we re-fire by bumping a key. Fixes the
  // "I clicked the same trigger again but nothing happened" case where the
  // child useEffect doesn't re-run because reward.id stayed the same.
  const remount = () => setTick((t) => t + 1);

  // When `keepAlive` is on, intercept onDismiss and re-trigger after the
  // toast unmounts, so designers can stare at the popup without racing it.
  useEffect(() => {
    if (!keepAlive || !active) return;
    const id = window.setInterval(() => remount(), 500);
    return () => window.clearInterval(id);
  }, [keepAlive, active]);

  const dismiss = () => {
    if (keepAlive) {
      // Don't actually clear the state — just remount to keep showing.
      remount();
      return;
    }
    setActive(null);
  };

  const fire = (id: ActiveKind) => {
    setActive(id);
    remount();
    // eslint-disable-next-line no-console
    console.log('[toast-preview] fire →', id);
  };

  const groups = Array.from(new Set(TRIGGERS.map((t) => t.group)));

  return (
    <main className="min-h-screen bg-surface px-4 py-12 sm:px-6 lg:px-12">
      <div className="max-w-3xl mx-auto pb-32">
        <header className="border-b-2 border-on-surface pb-5 mb-8">
          <p className="font-data-mono uppercase text-[10px] tracking-[0.22em] text-on-surface-variant mb-2">
            Dev preview · /dev/toasts
          </p>
          <h1 className="font-h1 text-[36px] sm:text-[44px] font-bold tracking-tight text-on-surface">
            Completion popups
          </h1>
          <p className="mt-3 font-body text-[14px] leading-relaxed text-on-surface-variant max-w-[60ch]">
            Click any trigger to render the matching toast at its real
            position. Each card lists where on screen the toast appears and
            how long until it auto-dismisses. Toggle <em>Keep alive</em> to
            stop the auto-dismiss while you’re reviewing it.
          </p>
        </header>

        {/* Keep-alive toggle + feedback reset */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-8">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={keepAlive}
              onChange={(e) => setKeepAlive(e.target.checked)}
              className="h-5 w-5 accent-primary"
            />
            <span className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface">
              Keep alive
            </span>
            <span className="font-body text-[12px] text-on-surface-variant">
              (re-renders the toast every 500 ms so it never auto-dismisses)
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              FEEDBACK_STORAGE_KEYS.forEach((k) => {
                try {
                  window.localStorage.removeItem(k);
                } catch {
                  /* ignore */
                }
              });
              remount();
            }}
            className="px-3 py-1.5 border border-surface-dim hover:border-on-surface bg-surface text-on-surface-variant hover:text-on-surface font-data-mono uppercase text-[10px] tracking-wider transition-colors"
          >
            Reset feedback storage
          </button>
        </div>

        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <section key={group}>
              <h2 className="font-data-mono uppercase text-[11px] tracking-[0.18em] text-on-surface mb-3 pb-2 border-b border-surface-dim">
                {group}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRIGGERS.filter((t) => t.group === group).map((t) => {
                  const isActive = active === t.id;
                  return (
                    <li key={t.id ?? 'none'}>
                      <button
                        type="button"
                        onClick={() => fire(t.id)}
                        className={`w-full flex flex-col items-stretch gap-1.5 px-4 py-3 border transition-colors text-left ${
                          isActive
                            ? 'border-primary bg-primary/[0.06] text-on-surface'
                            : 'border-surface-dim text-on-surface hover:border-on-surface hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-body text-[14px]">{t.label}</span>
                          <span
                            className={`font-data-mono uppercase text-[10px] tracking-wider ${
                              isActive ? 'text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            {isActive ? 'Showing →' : 'Fire →'}
                          </span>
                        </span>
                        <span className="font-data-mono text-[11px] text-on-surface-variant">
                          {t.position} · auto-dismiss {t.duration}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        {/* Status panel */}
        <aside
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[80] border border-on-surface bg-surface shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-data-mono uppercase text-[10px] tracking-[0.18em] text-on-surface-variant">
              Active
            </span>
            <span
              className={`font-data-mono text-[11px] tabular-nums ${
                active ? 'text-primary' : 'text-on-surface-variant'
              }`}
            >
              {active ?? 'none'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActive(null);
            }}
            disabled={!active}
            className="px-4 py-2 border border-on-surface bg-surface text-on-surface font-data-mono uppercase text-[11px] tracking-wider hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Dismiss now
          </button>
          <span className="font-body text-[11px] text-on-surface-variant leading-relaxed">
            If you don’t see the popup, scroll to its position above. Some
            render off-screen of this panel — try the &ldquo;Keep alive&rdquo;
            switch and check the corner described.
          </span>
        </aside>
      </div>

      {/* Diagnostic marker — GUARANTEED to render when active is set, no
          deps on framer-motion / keyframes. If this doesn't show, the
          click flow is broken; if it does, the toast component is. */}
      {active && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] pointer-events-none"
          style={{
            padding: '6px 14px',
            background: '#a33800',
            color: '#fdf9f0',
            fontFamily: 'var(--font-jetbrains-mono), monospace',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            boxShadow: '0 8px 24px -8px rgba(0,0,0,0.4)',
          }}
        >
          ▶ {active} (tick {tick})
        </div>
      )}

      {/* ── Render active toast (key-bumped to support remount) ─────── */}

      {active === 'kwh-lesson' && (
        <KWhRewardToast key={`kwh-l-${tick}`} reward={KWH_REWARDS.lesson} onDismiss={dismiss} />
      )}
      {active === 'kwh-track-junior' && (
        <KWhRewardToast key={`kwh-tj-${tick}`} reward={KWH_REWARDS.trackJunior} onDismiss={dismiss} />
      )}
      {active === 'kwh-track-mid' && (
        <KWhRewardToast key={`kwh-tm-${tick}`} reward={KWH_REWARDS.trackMid} onDismiss={dismiss} />
      )}
      {active === 'kwh-track-senior' && (
        <KWhRewardToast key={`kwh-ts-${tick}`} reward={KWH_REWARDS.trackSenior} onDismiss={dismiss} />
      )}

      {active === 'lesson-completion-mid' && (
        <LessonCompletionToast
          key={`lc-mid-${tick}`}
          moduleTitle="DataFrames — The Core Abstraction"
          moduleNumber={3}
          totalModules={10}
          completedModules={3}
          nextModuleTitle="Selecting and Filtering Data"
          onGoToNext={() => {
            // eslint-disable-next-line no-alert
            alert('Pretend we navigated to the next module');
            dismiss();
          }}
          onDismiss={dismiss}
          accentRgb="163, 56, 0"
        />
      )}

      {active === 'lesson-completion-finale' && (
        <LessonCompletionToast
          key={`lc-fin-${tick}`}
          moduleTitle="Spark SQL — The SQL Interface"
          moduleNumber={10}
          totalModules={10}
          completedModules={10}
          nextModuleTitle={null}
          onGoToNext={null}
          onDismiss={dismiss}
          accentRgb="163, 56, 0"
        />
      )}

      {active === 'session-started-pomodoro' && (
        <SessionStartedToast
          key={`ss-p-${tick}`}
          methodId="pomodoro"
          focusMinutes={25}
          breakMinutes={5}
          onDismiss={dismiss}
        />
      )}

      {active === 'session-started-free' && (
        <SessionStartedToast
          key={`ss-f-${tick}`}
          methodId="free-read"
          focusMinutes={0}
          breakMinutes={0}
          onDismiss={dismiss}
        />
      )}

      {active === 'session-ended-on-time' && (
        <SessionEndedToast
          key={`se-on-${tick}`}
          methodId="pomodoro"
          focusElapsedSeconds={25 * 60}
          plannedFocusMinutes={25}
          onDismiss={dismiss}
        />
      )}

      {active === 'session-ended-overrun' && (
        <SessionEndedToast
          key={`se-over-${tick}`}
          methodId="sprint"
          focusElapsedSeconds={6 * 60 + 42}
          plannedFocusMinutes={15}
          onDismiss={dismiss}
        />
      )}

      {/* Feedback widgets — these are inline components in the real app
          (rendered at the end of a lesson / module / track), not floating
          toasts. The dev preview wraps them in a centered overlay with a
          backdrop so reviewers can see them in isolation. */}
      {(active === 'feedback-module-complete' ||
        active === 'feedback-practice-set-cleared' ||
        active === 'feedback-practice-set-partial' ||
        active === 'feedback-track-complete-junior' ||
        active === 'feedback-track-complete-mid' ||
        active === 'feedback-track-complete-senior') && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-on-surface/30 backdrop-blur-sm overflow-y-auto py-8"
          onClick={dismiss}
        >
          <div
            className="w-full max-w-[560px]"
            onClick={(e) => e.stopPropagation()}
          >
            {active === 'feedback-module-complete' && (
              <ModuleCompleteFeedback
                key={`fb-mod-${tick}`}
                topic="pyspark"
                moduleId="preview-module-1"
                moduleTitle="DataFrames — The Core Abstraction"
                moduleNumber={3}
                onDismiss={dismiss}
              />
            )}
            {active === 'feedback-practice-set-cleared' && (
              <PracticeSetCompleteFeedback
                key={`fb-pset-cleared-${tick}`}
                topic="pyspark"
                moduleId="module-PS3"
                setTitle="Practice Set PS3 — DataFrames"
                tasksSolved={10}
                totalTasks={10}
                onDismiss={dismiss}
              />
            )}
            {active === 'feedback-practice-set-partial' && (
              <PracticeSetCompleteFeedback
                key={`fb-pset-partial-${tick}`}
                topic="pyspark"
                moduleId="module-FND-AGGREGATIONS-JUNIOR"
                setTitle="Fundamentals — Aggregations"
                tasksSolved={6}
                totalTasks={10}
                onDismiss={dismiss}
              />
            )}
            {active === 'feedback-track-complete-junior' && (
              <TrackCompleteFeedback
                key={`fb-track-j-${tick}`}
                topic="pyspark"
                trackSlug="junior"
                trackTitle="Junior — Core Foundation"
                totalModules={10}
                accentRgb="163, 56, 0"
                onDismiss={dismiss}
              />
            )}
            {active === 'feedback-track-complete-mid' && (
              <TrackCompleteFeedback
                key={`fb-track-m-${tick}`}
                topic="pyspark"
                trackSlug="mid"
                trackTitle="Mid — Advanced Transformations"
                totalModules={10}
                accentRgb="163, 56, 0"
                onDismiss={dismiss}
              />
            )}
            {active === 'feedback-track-complete-senior' && (
              <TrackCompleteFeedback
                key={`fb-track-s-${tick}`}
                topic="pyspark"
                trackSlug="senior"
                trackTitle="Senior — Cluster Tuning"
                totalModules={10}
                accentRgb="163, 56, 0"
                onDismiss={dismiss}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
