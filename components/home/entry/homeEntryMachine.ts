export type EntryPhase =
  | 'idle'
  | 'hand-enter'
  | 'card-place'
  | 'scanning'
  | 'activation'
  | 'reveal'
  | 'ready';

export type EntryMode = 'full' | 'short' | 'skip';

export interface EntryState {
  mode: EntryMode;
  phase: EntryPhase;
}

export type EntryAction =
  | { type: 'SET_MODE'; mode: EntryMode }
  | { type: 'NEXT' }
  | { type: 'SKIP' }
  | { type: 'TRANSITION'; phase: EntryPhase };

export const ENTRY_PHASE_ORDER: EntryPhase[] = [
  'idle',
  'hand-enter',
  'card-place',
  'scanning',
  'activation',
  'reveal',
  'ready'
];

const ENTRY_VISIT_FULL_SEEN = 'full-seen';
const ENTRY_VISIT_SHORT_SEEN = 'short-seen';

export const getNextPhase = (phase: EntryPhase): EntryPhase => {
  const currentIndex = ENTRY_PHASE_ORDER.indexOf(phase);
  if (currentIndex < 0 || currentIndex >= ENTRY_PHASE_ORDER.length - 1) {
    return 'ready';
  }
  return ENTRY_PHASE_ORDER[currentIndex + 1];
};

export const canTransition = (from: EntryPhase, to: EntryPhase): boolean => {
  if (from === to) return true;
  if (to === 'ready') return true;
  return getNextPhase(from) === to;
};

export const createInitialEntryState = (): EntryState => ({
  mode: 'full',
  phase: 'idle'
});

export const entryReducer = (state: EntryState, action: EntryAction): EntryState => {
  switch (action.type) {
    case 'SET_MODE':
      return action.mode === 'skip'
        ? { mode: 'skip', phase: 'ready' }
        : { mode: action.mode, phase: 'idle' };
    case 'NEXT':
      if (state.phase === 'ready') {
        return state;
      }
      return {
        ...state,
        phase: getNextPhase(state.phase)
      };
    case 'SKIP':
      return {
        ...state,
        phase: 'ready'
      };
    case 'TRANSITION':
      if (!canTransition(state.phase, action.phase)) {
        return state;
      }
      return {
        ...state,
        phase: action.phase
      };
    default:
      return state;
  }
};

export const resolveEntryMode = ({
  featureEnabled,
  prefersReducedMotion,
  sessionValue
}: {
  featureEnabled: boolean;
  prefersReducedMotion: boolean;
  sessionValue: string | null;
}): EntryMode => {
  if (!featureEnabled || prefersReducedMotion) {
    return 'skip';
  }

  if (
    sessionValue === ENTRY_VISIT_FULL_SEEN ||
    sessionValue === ENTRY_VISIT_SHORT_SEEN
  ) {
    return 'short';
  }

  return 'full';
};

export const getSessionMarkerForCompletedMode = (
  mode: EntryMode
): string | null => {
  if (mode === 'full') return ENTRY_VISIT_FULL_SEEN;
  if (mode === 'short') return ENTRY_VISIT_SHORT_SEEN;
  return null;
};
