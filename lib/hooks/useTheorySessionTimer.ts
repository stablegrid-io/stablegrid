'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  THEORY_SESSION_MICRO_TIPS,
  clampTheorySessionConfig,
  createIdleTheorySessionRuntime,
  getTheorySessionMethod,
  type TheorySessionConfig,
  type TheorySessionRuntime
} from '@/lib/learn/theorySession';

export function useTheorySessionTimer() {
  const [runtime, setRuntime] = useState<TheorySessionRuntime>(
    createIdleTheorySessionRuntime
  );
  const tipCursorRef = useRef(0);

  const reset = useCallback(() => {
    tipCursorRef.current = 0;
    setRuntime(createIdleTheorySessionRuntime());
  }, []);

  const start = useCallback((config: TheorySessionConfig) => {
    const nextConfig = clampTheorySessionConfig(config);
    const method = getTheorySessionMethod(nextConfig.methodId);

    if (!method) {
      return;
    }

    tipCursorRef.current = 0;
    setRuntime({
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
    });
  }, []);

  const pause = useCallback(() => {
    setRuntime((current) => {
      if (current.phase !== 'focus' && current.phase !== 'break') {
        return current;
      }

      return {
        ...current,
        phase: 'paused',
        pausedPhase: current.phase
      };
    });
  }, []);

  const resume = useCallback(() => {
    setRuntime((current) => {
      if (current.phase !== 'paused' || !current.pausedPhase) {
        return current;
      }

      return {
        ...current,
        phase: current.pausedPhase,
        pausedPhase: null
      };
    });
  }, []);

  const stop = useCallback(() => {
    setRuntime((current) => {
      if (!current.config) {
        return current;
      }

      if (current.elapsedSeconds === 0) {
        return createIdleTheorySessionRuntime();
      }

      return {
        ...current,
        phase: 'complete',
        pausedPhase: null,
        remainingSeconds: 0,
        summary: {
          totalElapsedSeconds: current.elapsedSeconds,
          focusElapsedSeconds: current.focusElapsedSeconds,
          breakElapsedSeconds: current.breakElapsedSeconds
        }
      };
    });
  }, []);

  const skipBreak = useCallback(() => {
    setRuntime((current) => {
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
  }, []);

  useEffect(() => {
    const isRunning = runtime.phase === 'focus' || runtime.phase === 'break';
    if (!isRunning) {
      return;
    }

    const interval = window.setInterval(() => {
      setRuntime((current) => {
        if (!current.config) {
          return current;
        }

        const method = getTheorySessionMethod(current.config.methodId);
        if (!method) {
          return current;
        }

        if (current.phase === 'focus') {
          if (!method.isTimed) {
            return {
              ...current,
              elapsedSeconds: current.elapsedSeconds + 1,
              focusElapsedSeconds: current.focusElapsedSeconds + 1
            };
          }

          const nextRemaining = Math.max(0, (current.remainingSeconds ?? 0) - 1);
          const nextElapsed = current.elapsedSeconds + 1;
          const nextFocusElapsed = current.focusElapsedSeconds + 1;

          if (nextRemaining > 0) {
            return {
              ...current,
              remainingSeconds: nextRemaining,
              elapsedSeconds: nextElapsed,
              focusElapsedSeconds: nextFocusElapsed
            };
          }

          if (current.currentRound >= current.config.rounds || current.config.breakMinutes <= 0) {
            return {
              ...current,
              phase: 'complete',
              completedRounds: current.currentRound,
              remainingSeconds: 0,
              elapsedSeconds: nextElapsed,
              focusElapsedSeconds: nextFocusElapsed,
              summary: {
                totalElapsedSeconds: nextElapsed,
                focusElapsedSeconds: nextFocusElapsed,
                breakElapsedSeconds: current.breakElapsedSeconds
              }
            };
          }

          const breakTip =
            THEORY_SESSION_MICRO_TIPS[
              tipCursorRef.current % THEORY_SESSION_MICRO_TIPS.length
            ] ?? null;
          tipCursorRef.current += 1;

          return {
            ...current,
            phase: 'break',
            completedRounds: current.currentRound,
            remainingSeconds: current.config.breakMinutes * 60,
            phaseDurationSeconds: current.config.breakMinutes * 60,
            elapsedSeconds: nextElapsed,
            focusElapsedSeconds: nextFocusElapsed,
            breakTip
          };
        }

        if (current.phase === 'break') {
          const nextRemaining = Math.max(0, (current.remainingSeconds ?? 0) - 1);
          const nextElapsed = current.elapsedSeconds + 1;
          const nextBreakElapsed = current.breakElapsedSeconds + 1;

          if (nextRemaining > 0) {
            return {
              ...current,
              remainingSeconds: nextRemaining,
              elapsedSeconds: nextElapsed,
              breakElapsedSeconds: nextBreakElapsed
            };
          }

          return {
            ...current,
            phase: 'focus',
            currentRound: Math.min(current.config.rounds, current.completedRounds + 1),
            remainingSeconds: current.config.focusMinutes * 60,
            phaseDurationSeconds: current.config.focusMinutes * 60,
            elapsedSeconds: nextElapsed,
            breakElapsedSeconds: nextBreakElapsed,
            breakTip: null
          };
        }

        return current;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [runtime.config, runtime.phase]);

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
