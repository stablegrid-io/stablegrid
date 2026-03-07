import { describe, expect, it } from 'vitest';
import {
  ACTIVATION_PHASE_ORDER,
  activationReducer,
  canTransitionActivationPhase,
  createInitialActivationState,
  getNextActivationPhase,
  resolveActivationMode
} from '@/components/home/activation-table/state/activationMachine';
import { ACTIVATION_PHASE_DURATIONS_MS } from '@/components/home/activation-table/state/activationTimings';

describe('home activation machine', () => {
  it('advances in deterministic phase order', () => {
    let state = createInitialActivationState();
    const traversed: string[] = [state.phase];

    for (let index = 0; index < ACTIVATION_PHASE_ORDER.length - 1; index += 1) {
      state = activationReducer(state, { type: 'NEXT' });
      traversed.push(state.phase);
    }

    expect(traversed).toEqual(ACTIVATION_PHASE_ORDER);
    expect(getNextActivationPhase('reveal')).toBe('ready');
  });

  it('rejects invalid transitions', () => {
    const revealState = {
      mode: 'full' as const,
      phase: 'reveal' as const
    };
    const invalid = activationReducer(revealState, {
      type: 'TRANSITION',
      phase: 'loading'
    });

    expect(canTransitionActivationPhase('reveal', 'loading')).toBe(false);
    expect(invalid.phase).toBe('reveal');
  });

  it('resolves full, short, and reduced-motion skip modes', () => {
    expect(
      resolveActivationMode({
        featureEnabled: true,
        prefersReducedMotion: false,
        seenValue: null,
        sessionModeValue: null
      })
    ).toBe('full');

    expect(
      resolveActivationMode({
        featureEnabled: true,
        prefersReducedMotion: false,
        seenValue: '1',
        sessionModeValue: null
      })
    ).toBe('short');

    expect(
      resolveActivationMode({
        featureEnabled: true,
        prefersReducedMotion: true,
        seenValue: null,
        sessionModeValue: null
      })
    ).toBe('skip');
  });

  it('keeps phase timing constants deterministic and positive', () => {
    const fullTotal = Object.values(ACTIVATION_PHASE_DURATIONS_MS.full).reduce(
      (sum, value) => sum + value,
      0
    );
    const shortTotal = Object.values(ACTIVATION_PHASE_DURATIONS_MS.short).reduce(
      (sum, value) => sum + value,
      0
    );

    expect(fullTotal).toBeGreaterThan(shortTotal);
    expect(shortTotal).toBeGreaterThan(0);
  });
});
