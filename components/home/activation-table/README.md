# Home Activation Table

## Current Surface
- `ActivationTable.tsx`: API-backed board shell + create-task modal/drawer flow.
- `components/BoardColumn.tsx`: section title/count + task mapping.
- `components/TaskCard.tsx`: minimal task card with restrained status/action cues.
- `HomeActivationTable.tsx`: compatibility wrapper for homepage wiring and feature flag.

## Interaction and Layout
- Desktop: balanced 3-column board.
- Tablet: horizontal snap scroll when columns need more space.
- Mobile: vertical stacked columns with generous spacing.
- Card hover: subtle raise, border brighten, and quiet background shift.
- Data flow: board and catalog are fetched from `/api/activation-board`; creation posts to `/api/activation-tasks`; start action patches `/api/activation-tasks/:id/start`.

## Legacy Motion State Files
- `state/activationMachine.ts` and `state/activationTimings.ts` are retained for existing unit coverage.
- Older animation-oriented UI components remain in this folder but are not part of the active homepage surface.
