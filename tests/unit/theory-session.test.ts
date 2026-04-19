import { describe, it, expect } from 'vitest';
import {
  buildTheorySessionTimeline,
  clampTheorySessionConfig,
  getTheorySessionTotalMinutes,
  formatTheorySessionClock,
  formatTheorySessionDuration,
  getDefaultTheorySessionConfig,
  type TheorySessionConfig,
} from '@/lib/learn/theorySession';

describe('buildTheorySessionTimeline', () => {
  it('pomodoro default: 4 focus + 3 break segments', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 4 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toHaveLength(7); // 4 focus + 3 breaks
    expect(timeline.filter((s) => s.kind === 'focus')).toHaveLength(4);
    expect(timeline.filter((s) => s.kind === 'break')).toHaveLength(3);
  });

  it('last round has no trailing break', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 2 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline[timeline.length - 1].kind).toBe('focus');
  });

  it('deep-focus default: 2 focus + 1 break', () => {
    const config: TheorySessionConfig = { methodId: 'deep-focus', focusMinutes: 50, breakMinutes: 10, rounds: 2 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toHaveLength(3);
    expect(timeline.map((s) => s.kind)).toEqual(['focus', 'break', 'focus']);
  });

  it('sprint default: 1 focus, 0 breaks', () => {
    const config: TheorySessionConfig = { methodId: 'sprint', focusMinutes: 15, breakMinutes: 0, rounds: 1 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toEqual({ key: 'focus-1', kind: 'focus', minutes: 15 });
  });

  it('sprint with breakMinutes=0 produces no break segments even with 2 rounds', () => {
    const config: TheorySessionConfig = { methodId: 'sprint', focusMinutes: 15, breakMinutes: 0, rounds: 2 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline.every((s) => s.kind === 'focus')).toBe(true);
    expect(timeline).toHaveLength(2);
  });

  it('free-read returns empty array (not timed)', () => {
    const config: TheorySessionConfig = { methodId: 'free-read', focusMinutes: 0, breakMinutes: 0, rounds: 1 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toEqual([]);
  });

  it('clamps rounds=0 to 1', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 0 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toHaveLength(1); // 1 focus, 0 breaks
    expect(timeline[0].kind).toBe('focus');
  });

  it('single round: 1 focus segment, no break', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 1 };
    const timeline = buildTheorySessionTimeline(config);
    expect(timeline).toHaveLength(1);
    expect(timeline[0]).toEqual({ key: 'focus-1', kind: 'focus', minutes: 25 });
  });

  it('assigns correct segment keys', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 3 };
    const timeline = buildTheorySessionTimeline(config);
    const keys = timeline.map((s) => s.key);
    expect(keys).toEqual(['focus-1', 'break-1', 'focus-2', 'break-2', 'focus-3']);
  });
});

describe('clampTheorySessionConfig', () => {
  it('clamps focus below min to min for pomodoro', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 5, breakMinutes: 5, rounds: 4 };
    const result = clampTheorySessionConfig(config);
    expect(result.focusMinutes).toBe(15); // pomodoro min=15
  });

  it('clamps focus above max to max for pomodoro', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 100, breakMinutes: 5, rounds: 4 };
    const result = clampTheorySessionConfig(config);
    expect(result.focusMinutes).toBe(45); // pomodoro max=45
  });

  it('uses default when range is null (deep-focus break/rounds)', () => {
    const config: TheorySessionConfig = { methodId: 'deep-focus', focusMinutes: 50, breakMinutes: 999, rounds: 999 };
    const result = clampTheorySessionConfig(config);
    expect(result.breakMinutes).toBe(10); // default (range is null)
    expect(result.rounds).toBe(2); // default (range is null)
  });

  it('throws for unknown methodId', () => {
    const config = { methodId: 'unknown' as any, focusMinutes: 25, breakMinutes: 5, rounds: 4 };
    expect(() => clampTheorySessionConfig(config)).toThrow('Unknown theory session method');
  });

  it('clamps break within range for pomodoro', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 1, rounds: 4 };
    const result = clampTheorySessionConfig(config);
    expect(result.breakMinutes).toBe(3); // pomodoro break min=3
  });

  it('clamps rounds within range for pomodoro', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 20 };
    const result = clampTheorySessionConfig(config);
    expect(result.rounds).toBe(8); // pomodoro round max=8
  });
});

describe('getTheorySessionTotalMinutes', () => {
  it('pomodoro default: 25*4 + 5*3 = 115', () => {
    const config: TheorySessionConfig = { methodId: 'pomodoro', focusMinutes: 25, breakMinutes: 5, rounds: 4 };
    expect(getTheorySessionTotalMinutes(config)).toBe(115);
  });

  it('deep-focus default: 50*2 + 10*1 = 110', () => {
    const config: TheorySessionConfig = { methodId: 'deep-focus', focusMinutes: 50, breakMinutes: 10, rounds: 2 };
    expect(getTheorySessionTotalMinutes(config)).toBe(110);
  });

  it('sprint default: 15', () => {
    const config: TheorySessionConfig = { methodId: 'sprint', focusMinutes: 15, breakMinutes: 0, rounds: 1 };
    expect(getTheorySessionTotalMinutes(config)).toBe(15);
  });

  it('free-read: 0', () => {
    const config: TheorySessionConfig = { methodId: 'free-read', focusMinutes: 0, breakMinutes: 0, rounds: 1 };
    expect(getTheorySessionTotalMinutes(config)).toBe(0);
  });
});

describe('formatTheorySessionClock', () => {
  it('formats 0 seconds as "0:00"', () => {
    expect(formatTheorySessionClock(0)).toBe('0:00');
  });

  it('formats 90 seconds as "1:30"', () => {
    expect(formatTheorySessionClock(90)).toBe('1:30');
  });

  it('formats 3661 seconds as "1:01:01"', () => {
    expect(formatTheorySessionClock(3661)).toBe('1:01:01');
  });

  it('clamps negative seconds to 0', () => {
    expect(formatTheorySessionClock(-10)).toBe('0:00');
  });
});

describe('formatTheorySessionDuration', () => {
  it('formats seconds to "X min" for under an hour', () => {
    expect(formatTheorySessionDuration(1500)).toBe('25 min'); // 25 min
  });

  it('formats exactly 1 hour', () => {
    expect(formatTheorySessionDuration(3600)).toBe('1h');
  });

  it('formats hours and minutes', () => {
    expect(formatTheorySessionDuration(5400)).toBe('1h 30m');
  });

  it('formats 0 seconds as "0 min"', () => {
    expect(formatTheorySessionDuration(0)).toBe('0 min');
  });
});

describe('getDefaultTheorySessionConfig', () => {
  it('returns correct defaults for pomodoro', () => {
    const config = getDefaultTheorySessionConfig('pomodoro');
    expect(config).toEqual({
      methodId: 'pomodoro',
      focusMinutes: 25,
      breakMinutes: 5,
      rounds: 4,
    });
  });

  it('returns correct defaults for free-read', () => {
    const config = getDefaultTheorySessionConfig('free-read');
    expect(config).toEqual({
      methodId: 'free-read',
      focusMinutes: 0,
      breakMinutes: 0,
      rounds: 1,
    });
  });
});
