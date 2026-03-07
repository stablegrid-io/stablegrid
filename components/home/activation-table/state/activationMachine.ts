export type ActivationPhase =
  | 'loading'
  | 'reveal'
  | 'ready';

export type ActivationMode = 'full' | 'short' | 'skip';

export interface ActivationState {
  mode: ActivationMode;
  phase: ActivationPhase;
}

export type ActivationAction =
  | { type: 'SET_MODE'; mode: ActivationMode }
  | { type: 'NEXT' }
  | { type: 'SKIP' }
  | { type: 'TRANSITION'; phase: ActivationPhase };

export const ACTIVATION_PHASE_ORDER: ActivationPhase[] = [
  'loading',
  'reveal',
  'ready'
];

export const getNextActivationPhase = (
  phase: ActivationPhase
): ActivationPhase => {
  const index = ACTIVATION_PHASE_ORDER.indexOf(phase);
  if (index < 0 || index >= ACTIVATION_PHASE_ORDER.length - 1) {
    return 'ready';
  }
  return ACTIVATION_PHASE_ORDER[index + 1];
};

export const canTransitionActivationPhase = (
  from: ActivationPhase,
  to: ActivationPhase
): boolean => {
  if (from === to) return true;
  if (to === 'ready') return true;
  return getNextActivationPhase(from) === to;
};

export const createInitialActivationState = (): ActivationState => ({
  mode: 'full',
  phase: 'loading'
});

export const activationReducer = (
  state: ActivationState,
  action: ActivationAction
): ActivationState => {
  switch (action.type) {
    case 'SET_MODE':
      return action.mode === 'skip'
        ? { mode: 'skip', phase: 'ready' }
        : { mode: action.mode, phase: 'loading' };
    case 'NEXT':
      if (state.phase === 'ready') {
        return state;
      }
      return {
        ...state,
        phase: getNextActivationPhase(state.phase)
      };
    case 'SKIP':
      return {
        ...state,
        phase: 'ready'
      };
    case 'TRANSITION':
      if (!canTransitionActivationPhase(state.phase, action.phase)) {
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

export const resolveActivationMode = ({
  featureEnabled,
  prefersReducedMotion,
  seenValue,
  sessionModeValue
}: {
  featureEnabled: boolean;
  prefersReducedMotion: boolean;
  seenValue: string | null;
  sessionModeValue: string | null;
}): ActivationMode => {
  if (!featureEnabled || prefersReducedMotion) {
    return 'skip';
  }

  if (sessionModeValue === 'short' || seenValue === '1') {
    return 'short';
  }

  return 'full';
};
