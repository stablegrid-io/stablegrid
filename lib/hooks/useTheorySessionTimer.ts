'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  THEORY_SESSION_MICRO_TIPS,
  clampTheorySessionConfig,
  createIdleTheorySessionRuntime,
  getTheorySessionMethod,
  type TheorySessionPhase,
  type TheorySessionConfig,
  type TheorySessionRuntime
} from '@/lib/learn/theorySession';

const THEORY_SESSION_STORAGE_PREFIX = 'theory-session-runtime:v1';
const THEORY_SESSION_PHASES: TheorySessionPhase[] = [
  'idle',
  'focus',
  'break',
  'paused',
  'complete'
];

interface PersistedTheorySessionSnapshot {
  version: 1;
  runtime: TheorySessionRuntime;
  tipCursor: number;
  savedAt: number;
}

interface RuntimeTransitionResult {
  runtime: TheorySessionRuntime;
  tipCursor: number;
}

const isTheorySessionPhase = (value: unknown): value is TheorySessionPhase => {
  return typeof value === 'string' && THEORY_SESSION_PHASES.includes(value as TheorySessionPhase);
};

const clampWholeNumber = (value: unknown, fallback: number, min = 0) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(min, Math.floor(value));
};

const buildCompleteRuntime = (runtime: TheorySessionRuntime): TheorySessionRuntime => ({
  ...runtime,
  phase: 'complete',
  pausedPhase: null,
  remainingSeconds: 0,
  summary: {
    totalElapsedSeconds: runtime.elapsedSeconds,
    focusElapsedSeconds: runtime.focusElapsedSeconds,
    breakElapsedSeconds: runtime.breakElapsedSeconds
  }
});

const sanitizeTheorySessionRuntime = (value: unknown): TheorySessionRuntime | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const runtimeRecord = value as Record<string, unknown>;
  const rawConfig = runtimeRecord.config;
  const config =
    rawConfig && typeof rawConfig === 'object'
      ? (() => {
          const configRecord = rawConfig as Record<string, unknown>;
          if (typeof configRecord.methodId !== 'string') {
            return null;
          }

          const method = getTheorySessionMethod(configRecord.methodId as TheorySessionConfig['methodId']);
          if (!method) {
            return null;
          }

          return clampTheorySessionConfig({
            methodId: method.id,
            focusMinutes: clampWholeNumber(
              configRecord.focusMinutes,
              method.defaultFocusMinutes,
              0
            ),
            breakMinutes: clampWholeNumber(
              configRecord.breakMinutes,
              method.defaultBreakMinutes,
              0
            ),
            rounds: clampWholeNumber(configRecord.rounds, method.defaultRounds, 1)
          });
        })()
      : null;

  const phase = isTheorySessionPhase(runtimeRecord.phase) ? runtimeRecord.phase : 'idle';
  const pausedPhase =
    runtimeRecord.pausedPhase === 'focus' || runtimeRecord.pausedPhase === 'break'
      ? runtimeRecord.pausedPhase
      : null;

  if (!config) {
    return phase === 'idle' ? createIdleTheorySessionRuntime() : null;
  }

  const method = getTheorySessionMethod(config.methodId);
  if (!method) {
    return null;
  }

  const focusDurationSeconds = method.isTimed ? config.focusMinutes * 60 : null;
  const breakDurationSeconds = method.isTimed ? config.breakMinutes * 60 : null;
  const effectivePhase = phase === 'paused' ? pausedPhase : phase;

  let remainingSeconds: number | null = null;
  let phaseDurationSeconds: number | null = null;

  if (method.isTimed && effectivePhase === 'focus') {
    remainingSeconds = clampWholeNumber(
      runtimeRecord.remainingSeconds,
      focusDurationSeconds ?? 0,
      0
    );
    phaseDurationSeconds = focusDurationSeconds;
  } else if (method.isTimed && effectivePhase === 'break') {
    remainingSeconds = clampWholeNumber(
      runtimeRecord.remainingSeconds,
      breakDurationSeconds ?? 0,
      0
    );
    phaseDurationSeconds = breakDurationSeconds;
  }

  const sanitized: TheorySessionRuntime = {
    config,
    phase,
    pausedPhase: phase === 'paused' ? pausedPhase : null,
    remainingSeconds,
    phaseDurationSeconds,
    currentRound: clampWholeNumber(runtimeRecord.currentRound, 1, 1),
    completedRounds: clampWholeNumber(runtimeRecord.completedRounds, 0, 0),
    elapsedSeconds: clampWholeNumber(runtimeRecord.elapsedSeconds, 0, 0),
    focusElapsedSeconds: clampWholeNumber(runtimeRecord.focusElapsedSeconds, 0, 0),
    breakElapsedSeconds: clampWholeNumber(runtimeRecord.breakElapsedSeconds, 0, 0),
    breakTip: typeof runtimeRecord.breakTip === 'string' ? runtimeRecord.breakTip : null,
    summary:
      runtimeRecord.summary && typeof runtimeRecord.summary === 'object'
        ? {
            totalElapsedSeconds: clampWholeNumber(
              (runtimeRecord.summary as Record<string, unknown>).totalElapsedSeconds,
              clampWholeNumber(runtimeRecord.elapsedSeconds, 0, 0),
              0
            ),
            focusElapsedSeconds: clampWholeNumber(
              (runtimeRecord.summary as Record<string, unknown>).focusElapsedSeconds,
              clampWholeNumber(runtimeRecord.focusElapsedSeconds, 0, 0),
              0
            ),
            breakElapsedSeconds: clampWholeNumber(
              (runtimeRecord.summary as Record<string, unknown>).breakElapsedSeconds,
              clampWholeNumber(runtimeRecord.breakElapsedSeconds, 0, 0),
              0
            )
          }
        : phase === 'complete'
          ? {
              totalElapsedSeconds: clampWholeNumber(runtimeRecord.elapsedSeconds, 0, 0),
              focusElapsedSeconds: clampWholeNumber(
                runtimeRecord.focusElapsedSeconds,
                0,
                0
              ),
              breakElapsedSeconds: clampWholeNumber(
                runtimeRecord.breakElapsedSeconds,
                0,
                0
              )
            }
          : null
  };

  if (!method.isTimed) {
    return {
      ...sanitized,
      remainingSeconds: null,
      phaseDurationSeconds: null,
      breakTip: null,
      pausedPhase: phase === 'paused' ? 'focus' : null
    };
  }

  if ((phase === 'break' || pausedPhase === 'break') && (config.breakMinutes <= 0 || !breakDurationSeconds)) {
    return {
      ...sanitized,
      phase: 'focus',
      pausedPhase: null,
      remainingSeconds: focusDurationSeconds,
      phaseDurationSeconds: focusDurationSeconds,
      breakTip: null
    };
  }

  return sanitized;
};

const persistTheorySessionSnapshot = (
  storageKey: string | null,
  runtime: TheorySessionRuntime,
  tipCursor: number
) => {
  if (!storageKey || typeof window === 'undefined') {
    return;
  }

  try {
    if (runtime.phase === 'idle' && !runtime.config) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const payload: PersistedTheorySessionSnapshot = {
      version: 1,
      runtime,
      tipCursor: clampWholeNumber(tipCursor, 0, 0),
      savedAt: Date.now()
    };

    window.sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // Ignore storage failures. The timer still works in-memory.
  }
};

const advanceTheorySessionRuntime = (
  runtime: TheorySessionRuntime,
  elapsedSeconds: number,
  tipCursor: number
): RuntimeTransitionResult => {
  if (!runtime.config) {
    return { runtime, tipCursor };
  }

  const method = getTheorySessionMethod(runtime.config.methodId);
  if (!method) {
    return { runtime: createIdleTheorySessionRuntime(), tipCursor: 0 };
  }

  let remaining = clampWholeNumber(elapsedSeconds, 0, 0);
  if (remaining === 0) {
    return { runtime, tipCursor };
  }

  if (runtime.phase !== 'focus' && runtime.phase !== 'break') {
    return { runtime, tipCursor };
  }

  if (!method.isTimed) {
    return {
      tipCursor,
      runtime: {
        ...runtime,
        elapsedSeconds: runtime.elapsedSeconds + remaining,
        focusElapsedSeconds: runtime.focusElapsedSeconds + remaining
      }
    };
  }

  let nextRuntime = runtime;
  let nextTipCursor = tipCursor;

  while (remaining > 0) {
    if (nextRuntime.phase === 'focus') {
      const currentConfig = nextRuntime.config;
      if (!currentConfig) {
        break;
      }

      const phaseRemaining = Math.max(
        0,
        nextRuntime.remainingSeconds ?? currentConfig.focusMinutes * 60
      );
      const consumed = Math.min(remaining, phaseRemaining);
      const focusElapsedSeconds = nextRuntime.focusElapsedSeconds + consumed;
      const elapsedTotalSeconds = nextRuntime.elapsedSeconds + consumed;
      const nextRemainingSeconds = phaseRemaining - consumed;

      nextRuntime = {
        ...nextRuntime,
        remainingSeconds: nextRemainingSeconds,
        phaseDurationSeconds: currentConfig.focusMinutes * 60,
        elapsedSeconds: elapsedTotalSeconds,
        focusElapsedSeconds
      };
      remaining -= consumed;

      if (nextRemainingSeconds > 0) {
        break;
      }

      if (
        nextRuntime.currentRound >= currentConfig.rounds ||
        currentConfig.breakMinutes <= 0
      ) {
        nextRuntime = buildCompleteRuntime(nextRuntime);
        break;
      }

      const breakTip =
        THEORY_SESSION_MICRO_TIPS[
          nextTipCursor % THEORY_SESSION_MICRO_TIPS.length
        ] ?? null;
      nextTipCursor += 1;

      nextRuntime = {
        ...nextRuntime,
        phase: 'break',
        completedRounds: nextRuntime.currentRound,
        remainingSeconds: currentConfig.breakMinutes * 60,
        phaseDurationSeconds: currentConfig.breakMinutes * 60,
        breakTip
      };
      continue;
    }

    if (nextRuntime.phase === 'break') {
      const currentConfig = nextRuntime.config;
      if (!currentConfig) {
        break;
      }

      const phaseRemaining = Math.max(
        0,
        nextRuntime.remainingSeconds ?? currentConfig.breakMinutes * 60
      );
      const consumed = Math.min(remaining, phaseRemaining);
      const breakElapsedSeconds = nextRuntime.breakElapsedSeconds + consumed;
      const elapsedTotalSeconds = nextRuntime.elapsedSeconds + consumed;
      const nextRemainingSeconds = phaseRemaining - consumed;

      nextRuntime = {
        ...nextRuntime,
        remainingSeconds: nextRemainingSeconds,
        phaseDurationSeconds: currentConfig.breakMinutes * 60,
        elapsedSeconds: elapsedTotalSeconds,
        breakElapsedSeconds
      };
      remaining -= consumed;

      if (nextRemainingSeconds > 0) {
        break;
      }

      nextRuntime = {
        ...nextRuntime,
        phase: 'focus',
        currentRound: Math.min(currentConfig.rounds, nextRuntime.completedRounds + 1),
        remainingSeconds: currentConfig.focusMinutes * 60,
        phaseDurationSeconds: currentConfig.focusMinutes * 60,
        breakTip: null
      };
      continue;
    }

    break;
  }

  return {
    runtime: nextRuntime,
    tipCursor: nextTipCursor
  };
};

const readTheorySessionSnapshot = (
  storageKey: string | null
): RuntimeTransitionResult | null => {
  if (!storageKey || typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.sessionStorage.getItem(storageKey);
    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue) as Partial<PersistedTheorySessionSnapshot>;
    if (parsedValue.version !== 1) {
      return null;
    }

    const runtime = sanitizeTheorySessionRuntime(parsedValue.runtime);
    if (!runtime) {
      return null;
    }

    const tipCursor = clampWholeNumber(parsedValue.tipCursor, 0, 0);
    const savedAt = clampWholeNumber(parsedValue.savedAt, Date.now(), 0);
    const elapsedSinceSaveSeconds = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));

    if (runtime.phase === 'focus' || runtime.phase === 'break') {
      return advanceTheorySessionRuntime(runtime, elapsedSinceSaveSeconds, tipCursor);
    }

    return {
      runtime,
      tipCursor
    };
  } catch {
    return null;
  }
};

export function useTheorySessionTimer(storageScope: string | null = 'global') {
  const storageKey = useMemo(
    () =>
      storageScope === null
        ? null
        : `${THEORY_SESSION_STORAGE_PREFIX}:${storageScope}`,
    [storageScope]
  );
  const [runtime, setRuntime] = useState<TheorySessionRuntime>(
    createIdleTheorySessionRuntime
  );
  const [hasHydrated, setHasHydrated] = useState(false);
  const tipCursorRef = useRef(0);
  const applyRuntimeUpdate = useCallback(
    (
      updater: (
        current: TheorySessionRuntime,
        tipCursor: number
      ) => TheorySessionRuntime | RuntimeTransitionResult
    ) => {
      setRuntime((current) => {
        const result = updater(current, tipCursorRef.current);
        const nextRuntime = 'runtime' in result ? result.runtime : result;
        const nextTipCursor = 'runtime' in result ? result.tipCursor : tipCursorRef.current;

        tipCursorRef.current = nextTipCursor;
        persistTheorySessionSnapshot(storageKey, nextRuntime, nextTipCursor);
        return nextRuntime;
      });
    },
    [storageKey]
  );

  useEffect(() => {
    const restoredSession = readTheorySessionSnapshot(storageKey);

    if (restoredSession) {
      tipCursorRef.current = restoredSession.tipCursor;
      setRuntime(restoredSession.runtime);
      persistTheorySessionSnapshot(storageKey, restoredSession.runtime, restoredSession.tipCursor);
    } else {
      tipCursorRef.current = 0;
      setRuntime(createIdleTheorySessionRuntime());
    }

    setHasHydrated(true);
  }, [storageKey]);

  const reset = useCallback(() => {
    applyRuntimeUpdate(() => ({
      runtime: createIdleTheorySessionRuntime(),
      tipCursor: 0
    }));
  }, [applyRuntimeUpdate]);

  const start = useCallback((config: TheorySessionConfig) => {
    const nextConfig = clampTheorySessionConfig(config);
    const method = getTheorySessionMethod(nextConfig.methodId);

    if (!method) {
      return;
    }

    applyRuntimeUpdate(() => ({
      runtime: {
        config: nextConfig,
        phase: 'focus',
        pausedPhase: null,
        remainingSeconds: method.isTimed ? nextConfig.focusMinutes * 60 : null,
        phaseDurationSeconds: method.isTimed ? nextConfig.focusMinutes * 60 : null,
        currentRound: 1,
        completedRounds: 0,
        elapsedSeconds: 0,
        focusElapsedSeconds: 0,
        breakElapsedSeconds: 0,
        breakTip: null,
        summary: null
      },
      tipCursor: 0
    }));
  }, [applyRuntimeUpdate]);

  const pause = useCallback(() => {
    applyRuntimeUpdate((current) => {
      if (current.phase !== 'focus' && current.phase !== 'break') {
        return current;
      }

      return {
        ...current,
        phase: 'paused',
        pausedPhase: current.phase
      };
    });
  }, [applyRuntimeUpdate]);

  const resume = useCallback(() => {
    applyRuntimeUpdate((current) => {
      if (current.phase !== 'paused' || !current.pausedPhase) {
        return current;
      }

      return {
        ...current,
        phase: current.pausedPhase,
        pausedPhase: null
      };
    });
  }, [applyRuntimeUpdate]);

  const stop = useCallback(() => {
    applyRuntimeUpdate((current) => {
      if (!current.config) {
        return current;
      }

      if (current.elapsedSeconds === 0) {
        return {
          runtime: createIdleTheorySessionRuntime(),
          tipCursor: 0
        };
      }

      return buildCompleteRuntime(current);
    });
  }, [applyRuntimeUpdate]);

  const skipBreak = useCallback(() => {
    applyRuntimeUpdate((current) => {
      if (!current.config) {
        return current;
      }

      const isPausedBreak =
        current.phase === 'paused' && current.pausedPhase === 'break';

      if (current.phase !== 'break' && !isPausedBreak) {
        return current;
      }

      return {
        ...current,
        phase: 'focus',
        pausedPhase: null,
        remainingSeconds: current.config.focusMinutes * 60,
        phaseDurationSeconds: current.config.focusMinutes * 60,
        currentRound: Math.min(current.config.rounds, current.completedRounds + 1),
        breakTip: null
      };
    });
  }, [applyRuntimeUpdate]);

  useEffect(() => {
    const isRunning = runtime.phase === 'focus' || runtime.phase === 'break';
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      applyRuntimeUpdate((current, tipCursor) =>
        advanceTheorySessionRuntime(current, 1, tipCursor)
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [applyRuntimeUpdate, runtime.phase]);

  const method = useMemo(
    () => (runtime.config ? getTheorySessionMethod(runtime.config.methodId) ?? null : null),
    [runtime.config]
  );

  const roundCount = useMemo(() => {
    if (!runtime.config || !method) {
      return 0;
    }

    return method.isTimed ? runtime.config.rounds : 1;
  }, [method, runtime.config]);

  const activeRound = useMemo(() => {
    if (!roundCount) {
      return 0;
    }

    const isBreakPhase =
      runtime.phase === 'break' ||
      (runtime.phase === 'paused' && runtime.pausedPhase === 'break');

    if (runtime.phase === 'complete') {
      return roundCount;
    }

    if (isBreakPhase) {
      return Math.min(roundCount, runtime.completedRounds + 1);
    }

    return Math.min(roundCount, runtime.currentRound);
  }, [
    roundCount,
    runtime.completedRounds,
    runtime.currentRound,
    runtime.pausedPhase,
    runtime.phase
  ]);

  return {
    ...runtime,
    method,
    roundCount,
    activeRound,
    hasHydrated,
    hasActiveSession:
      runtime.phase === 'focus' ||
      runtime.phase === 'break' ||
      runtime.phase === 'paused',
    isOnBreak:
      runtime.phase === 'break' ||
      (runtime.phase === 'paused' && runtime.pausedPhase === 'break'),
    start,
    pause,
    resume,
    stop,
    skipBreak,
    reset
  };
}
