# Home Entry Experience

## Structure
- `HomeEntryExperience.tsx`: Top-level orchestrator (phase machine, mode resolution, persistence, focus handoff).
- `EntryScene.tsx`: Dormant scene overlay (grid, dock, hand/card trigger).
- `ActivationDock.tsx`: Reader pad with scan pulse and activation state visuals.
- `HandWithCard.tsx`: Stylized hand + card placement motion.
- `WorkspaceReveal.tsx`: Final homepage reveal shell (route map only).
- `LearningRouteMap.tsx`: Route-map wrapper using existing `LearningGrid`.
- `homeEntryMachine.ts`: Typed phase model + reducer + mode resolution helpers.
- `motionTokens.ts`: Named timing/easing/session constants.

## Phases
`idle -> hand-enter -> card-place -> scanning -> activation -> reveal -> ready`

The reducer enforces deterministic movement and rejects invalid transitions.

## Duration Tuning
Edit `ENTRY_PHASE_DURATIONS_MS` in `motionTokens.ts`.
- Full sequence target: ~2.3–3.0s.
- Short sequence target: ~0.9–1.3s.
- Skip mode is immediate.

## Repeat Visit Logic
Uses `sessionStorage` key: `stablegrid.home-entry-mode`.
- no marker: full animation
- `full-seen`: short animation
- `short-seen`: short animation (kept visible on repeat visits)

Markers are written only when phase reaches `ready`.

## Reduced Motion
Reduced motion is detected via `matchMedia('(prefers-reduced-motion: reduce)')`.
When enabled, mode resolves to `skip` and the reveal appears immediately with no travel-heavy motion.

## Feature Flag
Pass `featureEnabled={false}` to `HomeEntryExperience` to disable the ritual and reveal directly.
