# Grid Ops Scene Runbook

## Purpose
Operational controls and recovery steps for the `/energy` 2.5D renderer.

## Normal Mode
- `/energy` renders the R3F scene by default.
- HUD remains React DOM (`GridOpsCommandBar`, `MissionControlDrawer`, `TechDeckDock`).

## Emergency Disable
Set environment variable:

```bash
NEXT_PUBLIC_GRID_SCENE_DISABLE=true
```

Behavior:
- Scene rendering is bypassed.
- `/energy` shows a controlled ops-disabled message.

## Asset Validation
Before deployment, run:

```bash
node tools/validate-grid-assets.cjs
```

Checks:
- Required model names exist in `public/grid-assets/models/`
- File sizes remain within thresholds

## Diagnostics
- In dev mode, FPS sampler appears in scene (top-right).
- Use browser devtools Performance and GPU profiling for bottlenecks.

## Rollback
1. Set `NEXT_PUBLIC_GRID_SCENE_DISABLE=true`.
2. Redeploy.
3. Confirm `/energy` page is stable and usable.
4. Investigate scene error logs and asset issues.
