export const ENTRY_SESSION_KEY = 'stablegrid.home-entry-mode';

export const ENTRY_EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const ENTRY_EASE_STANDARD = [0.32, 0.72, 0, 1] as const;

export const ENTRY_PHASE_DURATIONS_MS = {
  full: {
    idle: 180,
    'hand-enter': 520,
    'card-place': 360,
    scanning: 520,
    activation: 520,
    reveal: 380
  },
  short: {
    idle: 80,
    'hand-enter': 220,
    'card-place': 180,
    scanning: 180,
    activation: 220,
    reveal: 180
  },
  skip: {
    idle: 0,
    'hand-enter': 0,
    'card-place': 0,
    scanning: 0,
    activation: 0,
    reveal: 0
  }
} as const;

export const SCAN_LINE_DURATION_MS = {
  full: 480,
  short: 220
} as const;
