# Grid Ops 2.5D Asset Spec (v1)

## Required Models
- `control-center.glb`
- `smart-transformer.glb`
- `solar-forecasting-array.glb`
- `battery-storage.glb`
- `frequency-controller.glb`
- `demand-response-system.glb`
- `grid-flywheel.glb`
- `hvdc-interconnector.glb`
- `ai-grid-optimizer.glb`

## Budget Targets
- Per model triangles: `<= 6,000` (target `1,500 - 4,000`)
- File size per model: `<= 1.8 MB`
- Material count per model: `<= 3`
- Texture set per model: optional, keep total texture payload minimal

## Scale and Pivot
- Unit scale: meters
- Base footprint should fit a `1.0 x 1.0` tile in scene space
- Model origin/pivot should be centered at base contact point
- Y-up orientation

## Style Rules
- Low-poly stylized technical miniatures
- Matte dark bodies + selective emissive strips
- Avoid photoreal PBR complexity
- Keep silhouettes readable at distance

## Validation
Run:

```bash
node tools/validate-grid-assets.cjs
```

CI should fail if required model files are missing or exceed size limits.
