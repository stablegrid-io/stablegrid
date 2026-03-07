import { describe, expect, it } from 'vitest';
import {
  canTransition,
  createInitialEntryState,
  entryReducer,
  getNextPhase,
  getSessionMarkerForCompletedMode,
  resolveEntryMode
} from '@/components/home/entry/homeEntryMachine';

describe('home entry machine', () => {
  it('advances through valid phase order only', () => {
    const initial = createInitialEntryState();
    const handEnter = entryReducer(initial, { type: 'NEXT' });
    const cardPlace = entryReducer(handEnter, { type: 'NEXT' });

    expect(initial.phase).toBe('idle');
    expect(handEnter.phase).toBe('hand-enter');
    expect(cardPlace.phase).toBe('card-place');
    expect(getNextPhase('reveal')).toBe('ready');
  });

  it('rejects invalid phase transitions', () => {
    const initial = createInitialEntryState();
    const invalid = entryReducer(initial, {
      type: 'TRANSITION',
      phase: 'activation'
    });

    expect(canTransition('idle', 'activation')).toBe(false);
    expect(invalid.phase).toBe('idle');
  });

  it('resolves modes for first visit, repeat visit, and reduced motion', () => {
    const firstVisit = resolveEntryMode({
      featureEnabled: true,
      prefersReducedMotion: false,
      sessionValue: null
    });
    const repeatVisit = resolveEntryMode({
      featureEnabled: true,
      prefersReducedMotion: false,
      sessionValue: 'full-seen'
    });
    const repeatVisitAgain = resolveEntryMode({
      featureEnabled: true,
      prefersReducedMotion: false,
      sessionValue: 'short-seen'
    });
    const reducedMotion = resolveEntryMode({
      featureEnabled: true,
      prefersReducedMotion: true,
      sessionValue: null
    });

    expect(firstVisit).toBe('full');
    expect(repeatVisit).toBe('short');
    expect(repeatVisitAgain).toBe('short');
    expect(reducedMotion).toBe('skip');
    expect(getSessionMarkerForCompletedMode('full')).toBe('full-seen');
    expect(getSessionMarkerForCompletedMode('short')).toBe('short-seen');
  });
});
