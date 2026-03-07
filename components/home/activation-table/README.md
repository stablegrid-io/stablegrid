# Home Activation Table

## Structure
- `HomeActivationTable.tsx`: top-level phase orchestrator + session/reduced-motion mode logic.
- `state/activationMachine.ts`: typed reducer and deterministic phase transitions.
- `state/activationTimings.ts`: centralized durations, easing, and session keys.
- `components/LearningStationLoader.tsx`: minimal loading layer with Learning Station label + progress bar.
- `components/TableSurface.tsx`: final responsive worktable composition.
- `components/ActivationCategoryCard.tsx`: category card template used for Theory, Tasks, and Grid.
- `components/SurfaceGlowLayer.tsx`: subtle activation lighting.

## Phases
`loading -> reveal -> ready`

`activationMachine.ts` prevents impossible backward jumps and keeps transitions deterministic.

## Duration Tuning
Update `ACTIVATION_PHASE_DURATIONS_MS` in `state/activationTimings.ts`.
- Full first visit target: ~1.4s to 1.8s.
- Repeat session target: ~0.6s to 0.9s.
- Reduced motion mode resolves to `skip` (near-instant).

## Repeat Visit Logic
Session keys:
- `homeActivationSeen`
- `homeActivationMode`

Behavior:
- first session visit: full sequence
- repeat in same session: short sequence
- reduced motion / feature disabled: skip to ready

## Accessibility
- Decorative layers are `aria-hidden`.
- Focus is moved to the primary CTA after `ready`.
- Reduced motion users bypass travel-heavy animation.
- Animation layer is removed from interaction flow at `ready`.
