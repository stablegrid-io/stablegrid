'use client';

import { AnimatePresence } from 'framer-motion';
import { useEffect, useReducer, useRef } from 'react';
import { EntryScene } from '@/components/home/entry/EntryScene';
import { WorkspaceReveal } from '@/components/home/entry/WorkspaceReveal';
import {
  createInitialEntryState,
  entryReducer,
  getSessionMarkerForCompletedMode,
  resolveEntryMode
} from '@/components/home/entry/homeEntryMachine';
import { ENTRY_PHASE_DURATIONS_MS, ENTRY_SESSION_KEY } from '@/components/home/entry/motionTokens';
import type { LearningRouteMapData } from '@/components/home/entry/types';

export interface HomeEntryExperienceProps {
  map: LearningRouteMapData;
  featureEnabled?: boolean;
}

export const HomeEntryExperience = ({
  map,
  featureEnabled = true
}: HomeEntryExperienceProps) => {
  const [state, dispatch] = useReducer(entryReducer, undefined, createInitialEntryState);
  const workspaceRevealRef = useRef<HTMLDivElement>(null);
  const hasPersistedRef = useRef(false);
  const modeResolvedRef = useRef(false);

  useEffect(() => {
    if (modeResolvedRef.current) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sessionValue = window.sessionStorage.getItem(ENTRY_SESSION_KEY);
    const mode = resolveEntryMode({
      featureEnabled,
      prefersReducedMotion: reducedMotion,
      sessionValue
    });

    modeResolvedRef.current = true;
    dispatch({ type: 'SET_MODE', mode });
  }, [featureEnabled]);

  useEffect(() => {
    if (!modeResolvedRef.current) {
      return;
    }
    if (state.phase === 'ready') {
      return;
    }
    if (state.mode === 'skip') {
      dispatch({ type: 'SKIP' });
      return;
    }

    const phaseDurations = ENTRY_PHASE_DURATIONS_MS[state.mode];
    const duration = phaseDurations[state.phase];
    const timeoutId = window.setTimeout(() => {
      dispatch({ type: 'NEXT' });
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.mode, state.phase]);

  useEffect(() => {
    if (state.phase !== 'ready') {
      return;
    }

    if (!hasPersistedRef.current) {
      const marker = getSessionMarkerForCompletedMode(state.mode);
      if (marker) {
        window.sessionStorage.setItem(ENTRY_SESSION_KEY, marker);
      }
      hasPersistedRef.current = true;
    }

    const recommendedNodeButton = workspaceRevealRef.current?.querySelector<HTMLButtonElement>(
      `button[data-testid="learning-grid-node-${map.recommendedNodeId}"]`
    );
    if (recommendedNodeButton) {
      recommendedNodeButton.focus();
      return;
    }

    const fallbackFocusable = workspaceRevealRef.current?.querySelector<HTMLElement>(
      'button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    fallbackFocusable?.focus();
  }, [map.recommendedNodeId, state.mode, state.phase]);

  const revealVisible = state.phase === 'reveal' || state.phase === 'ready';

  return (
    <div
      data-testid="home-entry-experience"
      data-phase={state.phase}
      data-mode={state.mode}
      className="relative"
    >
      <WorkspaceReveal
        isVisible={revealVisible}
        isReady={state.phase === 'ready'}
        map={map}
        containerRef={workspaceRevealRef}
      />

      <AnimatePresence>
        {state.phase !== 'ready' ? (
          <EntryScene
            phase={state.phase}
            mode={state.mode}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};
