'use client';

import { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { LearningStationLoader } from '@/components/home/activation-table/components/LearningStationLoader';
import { StationPulseWidget } from '@/components/home/activation-table/components/StationPulseWidget';
import { TableSurface } from '@/components/home/activation-table/components/TableSurface';
import {
  activationReducer,
  createInitialActivationState,
  resolveActivationMode
} from '@/components/home/activation-table/state/activationMachine';
import {
  ACTIVATION_PHASE_DURATIONS_MS,
  HOME_ACTIVATION_MODE_KEY,
  HOME_ACTIVATION_SEEN_KEY
} from '@/components/home/activation-table/state/activationTimings';
import type { HomeActivationTableData } from '@/components/home/activation-table/types';

export interface HomeActivationTableProps {
  data: HomeActivationTableData;
  featureEnabled?: boolean;
}

export const HomeActivationTable = ({
  data,
  featureEnabled = true
}: HomeActivationTableProps) => {
  const [state, dispatch] = useReducer(
    activationReducer,
    undefined,
    createInitialActivationState
  );
  const tableRef = useRef<HTMLDivElement>(null);
  const primaryActionRef = useRef<HTMLAnchorElement>(null);
  const modeResolvedRef = useRef(false);
  const persistedRef = useRef(false);

  useEffect(() => {
    if (modeResolvedRef.current) {
      return;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seenValue = window.sessionStorage.getItem(HOME_ACTIVATION_SEEN_KEY);
    const modeValue = window.sessionStorage.getItem(HOME_ACTIVATION_MODE_KEY);
    const mode = resolveActivationMode({
      featureEnabled,
      prefersReducedMotion: reducedMotion,
      seenValue,
      sessionModeValue: modeValue
    });

    modeResolvedRef.current = true;
    dispatch({ type: 'SET_MODE', mode });
  }, [featureEnabled]);

  useEffect(() => {
    if (!modeResolvedRef.current || state.phase === 'ready') {
      return;
    }
    if (state.mode === 'skip') {
      dispatch({ type: 'SKIP' });
      return;
    }

    const duration = ACTIVATION_PHASE_DURATIONS_MS[state.mode][state.phase];
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

    if (!persistedRef.current) {
      window.sessionStorage.setItem(HOME_ACTIVATION_SEEN_KEY, '1');
      window.sessionStorage.setItem(HOME_ACTIVATION_MODE_KEY, 'short');
      persistedRef.current = true;
    }

    primaryActionRef.current?.focus();
  }, [state.phase]);

  const showLoader = state.phase !== 'ready';

  return (
    <div
      data-testid="home-activation-table"
      data-phase={state.phase}
      data-mode={state.mode}
      className="relative"
    >
      <TableSurface
        data={data}
        phase={state.phase}
        containerRef={tableRef}
        primaryActionRef={primaryActionRef}
      />

      {showLoader ? (
        <LearningStationLoader
          mode={state.mode}
          phase={state.phase}
        />
      ) : null}

      <AnimatePresence>
        <StationPulseWidget visible={state.phase === 'ready'} />
      </AnimatePresence>
    </div>
  );
};
