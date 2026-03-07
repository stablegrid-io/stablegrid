import type { ActivationPhase } from '@/components/home/activation-table/state/activationMachine';

export const HOME_ACTIVATION_SEEN_KEY = 'homeActivationSeen';
export const HOME_ACTIVATION_MODE_KEY = 'homeActivationMode';

export const ACTIVATION_EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const ACTIVATION_EASE_STANDARD = [0.32, 0.72, 0, 1] as const;

type TimedPhase = Exclude<ActivationPhase, 'ready'>;
type PhaseDurations = Record<TimedPhase, number>;

export const ACTIVATION_PHASE_DURATIONS_MS: Record<
  'full' | 'short' | 'skip',
  PhaseDurations
> = {
  full: {
    loading: 1380,
    reveal: 300
  },
  short: {
    loading: 600,
    reveal: 220
  },
  skip: {
    loading: 0,
    reveal: 0
  }
};

export const ACTIVATION_PROGRESS_DURATION_MS = {
  full: ACTIVATION_PHASE_DURATIONS_MS.full.loading,
  short: ACTIVATION_PHASE_DURATIONS_MS.short.loading
} as const;
