export type TheorySessionMethodId =
  | 'pomodoro'
  | 'deep-focus'
  | 'sprint'
  | 'free-read';

export type TheorySessionPhase =
  | 'idle'
  | 'focus'
  | 'break'
  | 'paused'
  | 'complete';

export interface TheorySessionRange {
  min: number;
  max: number;
  step: number;
}

export interface TheorySessionMethodDefinition {
  id: TheorySessionMethodId;
  label: string;
  cadenceLabel: string;
  description: string;
  bestFor: string;
  isTimed: boolean;
  defaultFocusMinutes: number;
  defaultBreakMinutes: number;
  defaultRounds: number;
  focusRange: TheorySessionRange | null;
  breakRange: TheorySessionRange | null;
  roundRange: TheorySessionRange | null;
}

export interface TheorySessionConfig {
  methodId: TheorySessionMethodId;
  focusMinutes: number;
  breakMinutes: number;
  rounds: number;
}

export interface TheorySessionTimelineSegment {
  key: string;
  kind: 'focus' | 'break';
  minutes: number;
}

export interface TheorySessionSummary {
  totalElapsedSeconds: number;
  focusElapsedSeconds: number;
  breakElapsedSeconds: number;
}

export interface TheorySessionRuntime {
  config: TheorySessionConfig | null;
  phase: TheorySessionPhase;
  pausedPhase: Extract<TheorySessionPhase, 'focus' | 'break'> | null;
  remainingSeconds: number | null;
  phaseDurationSeconds: number | null;
  currentRound: number;
  completedRounds: number;
  elapsedSeconds: number;
  focusElapsedSeconds: number;
  breakElapsedSeconds: number;
  breakTip: string | null;
  summary: TheorySessionSummary | null;
}

export const THEORY_SESSION_METHODS: TheorySessionMethodDefinition[] = [
  {
    id: 'pomodoro',
    label: 'Pomodoro',
    cadenceLabel: '25 / 5 · 4 rounds',
    description: 'Structured rhythm with regular breaks.',
    bestFor: 'Best for dense material when you need frequent reset points.',
    isTimed: true,
    defaultFocusMinutes: 25,
    defaultBreakMinutes: 5,
    defaultRounds: 4,
    focusRange: { min: 15, max: 45, step: 5 },
    breakRange: { min: 3, max: 15, step: 1 },
    roundRange: { min: 2, max: 8, step: 1 }
  },
  {
    id: 'deep-focus',
    label: 'Deep Focus',
    cadenceLabel: '50 / 10 · 2 rounds',
    description: 'Longer concentration with fewer interruptions.',
    bestFor: 'Best for long chapters and deep systems content like Spark internals.',
    isTimed: true,
    defaultFocusMinutes: 50,
    defaultBreakMinutes: 10,
    defaultRounds: 2,
    focusRange: { min: 35, max: 90, step: 5 },
    breakRange: null,
    roundRange: null
  },
  {
    id: 'sprint',
    label: 'Sprint',
    cadenceLabel: '15 min · 1 round',
    description: 'One clean burst with no break.',
    bestFor: 'Best for review, short lessons, or when time is tight.',
    isTimed: true,
    defaultFocusMinutes: 15,
    defaultBreakMinutes: 0,
    defaultRounds: 1,
    focusRange: { min: 10, max: 30, step: 5 },
    breakRange: null,
    roundRange: null
  },
  {
    id: 'free-read',
    label: 'Free Read',
    cadenceLabel: 'No timer',
    description: 'Open-ended reading without a countdown.',
    bestFor: 'Best for exploration when you do not want structure in the way.',
    isTimed: false,
    defaultFocusMinutes: 0,
    defaultBreakMinutes: 0,
    defaultRounds: 1,
    focusRange: null,
    breakRange: null,
    roundRange: null
  }
];

export const THEORY_SESSION_MICRO_TIPS = [
  'Look at something 20 feet away for 20 seconds.',
  'Unclench your jaw and drop your shoulders.',
  'Stand up and change your eye line for a moment.',
  'Take three slower breaths before the next round.',
  'Roll your wrists and let your hands relax.',
  'Let your gaze soften instead of checking another screen.'
];

export const createIdleTheorySessionRuntime = (): TheorySessionRuntime => ({
  config: null,
  phase: 'idle',
  pausedPhase: null,
  remainingSeconds: null,
  phaseDurationSeconds: null,
  currentRound: 1,
  completedRounds: 0,
  elapsedSeconds: 0,
  focusElapsedSeconds: 0,
  breakElapsedSeconds: 0,
  breakTip: null,
  summary: null
});

export const getTheorySessionMethod = (methodId: TheorySessionMethodId) => {
  return THEORY_SESSION_METHODS.find((method) => method.id === methodId);
};

const clampToRange = (value: number, range: TheorySessionRange | null, fallback: number) => {
  if (!range) return fallback;
  return Math.max(range.min, Math.min(range.max, value));
};

export const getDefaultTheorySessionConfig = (
  methodId: TheorySessionMethodId
): TheorySessionConfig => {
  const method = getTheorySessionMethod(methodId);
  if (!method) {
    throw new Error(`Unknown theory session method: ${methodId}`);
  }

  return {
    methodId,
    focusMinutes: method.defaultFocusMinutes,
    breakMinutes: method.defaultBreakMinutes,
    rounds: method.defaultRounds
  };
};

export const clampTheorySessionConfig = (
  input: TheorySessionConfig
): TheorySessionConfig => {
  const method = getTheorySessionMethod(input.methodId);
  if (!method) {
    throw new Error(`Unknown theory session method: ${input.methodId}`);
  }

  return {
    methodId: input.methodId,
    focusMinutes: clampToRange(
      input.focusMinutes,
      method.focusRange,
      method.defaultFocusMinutes
    ),
    breakMinutes: clampToRange(
      input.breakMinutes,
      method.breakRange,
      method.defaultBreakMinutes
    ),
    rounds: clampToRange(input.rounds, method.roundRange, method.defaultRounds)
  };
};

export const buildTheorySessionTimeline = (
  config: TheorySessionConfig
): TheorySessionTimelineSegment[] => {
  const method = getTheorySessionMethod(config.methodId);
  if (!method?.isTimed) {
    return [];
  }

  const safeRounds = Math.max(1, config.rounds);
  const segments: TheorySessionTimelineSegment[] = [];

  for (let index = 0; index < safeRounds; index += 1) {
    segments.push({
      key: `focus-${index + 1}`,
      kind: 'focus',
      minutes: config.focusMinutes
    });

    if (config.breakMinutes > 0 && index < safeRounds - 1) {
      segments.push({
        key: `break-${index + 1}`,
        kind: 'break',
        minutes: config.breakMinutes
      });
    }
  }

  return segments;
};

export const getTheorySessionTotalMinutes = (config: TheorySessionConfig) => {
  return buildTheorySessionTimeline(config).reduce(
    (total, segment) => total + segment.minutes,
    0
  );
};

export const formatTheorySessionClock = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const formatTheorySessionDuration = (seconds: number) => {
  const safeMinutes = Math.round(Math.max(0, seconds) / 60);

  if (safeMinutes < 60) {
    return `${safeMinutes} min`;
  }

  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
};
