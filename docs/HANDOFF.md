# Exterior handoff

## Current state

Milestone 1 only: a two-storey house, garden, tree framing the upstairs double window, and guided camera arrival outside that window. The user accepted the latest render after asking for denser foliage, matching long flower planters, a surrounding fence with a small wooden gate, and sky/clouds with gentle sunlight.

Read `AGENT.md`, `docs/PROJECT_SPEC.md`, and the approved Blender addendum at `docs/superpowers/specs/2026-10-20-blender-exterior-assets-design.md`. The addendum permits local Blender GLB assets for the house/tree despite the original procedural-only Milestone 1 wording. The garden remains procedural. Bedroom, watering, blooming and card behavior require the next approved scope.

## Run and edit

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

- House/tree source and rebuild instructions: `assets/blender/README.md`.
- Editable Blender source: `assets/blender/exterior-house-tree.blend`.
- Repeatable authoring script: `assets/blender/create-exterior.py`.
- Runtime asset: `public/models/exterior-house-tree.glb` (packed textures, no remote resources).
- Garden/planters/flowers: `src/scene/exterior/build-garden.ts`.
- Boundary and open gate: `src/scene/exterior/build-boundary.ts`.
- Sky, sunlight and renderer: `src/scene/create-scene.ts`.
- Camera poses: `src/scene/exterior/build-exterior.ts`.
- Loading/cancellation and scene startup: `src/main.ts`, `src/scene/assets/load-exterior-model.ts`.

The GLB requires the named nodes documented in the asset README. Preserve the Y-up/+Z-front convention and the single assembly offset. A 12-second load/decode deadline selects the procedural fallback; parsed results arriving after cancellation are disposed. Preserve shared garden materials when replacing the fallback architecture.

## Verification at handoff

The final source/assets match the reviewed manifest SHA-256 `67618A11DB7BAA92271997D05023E51A5D80B83FB036E185061AE7703410C51B`. GLB SHA-256: `e548f10b90dab7cad02b5918e631438946d5d7e0812a7983d91e9662d78b4279`.

- **PASS:** typecheck, production build, diff whitespace, packed GLB validation, desktop/portrait render, keyboard/repeated skip, resize mid-intro, reduced motion, missing/malformed/missing-anchor fallback, delayed-load early skip, teardown during load, and WebGL fallback.
- **PASS:** two independent read-only final reviews after widening the gate's clear passage.
- **PASS:** normal-load JavaScript errors absent. **FAIL:** warning-free console; desktop shader precision warning X4122 remains.
- **NOT_RUN:** physical-phone performance. Headless portrait viewport is not a physical-device measurement.
- Vite warns about the approximately 746 kB minified JavaScript chunk (approximately 202 kB gzip).

Full behavior checks were run before the final sky softness/gate-angle refinements; these refinements did not change loader/input/cleanup logic. Final desktop/portrait captures and keyboard skip were rechecked afterward. The GLB is approximately 5.65 MB with 77,744 triangles and 30 mesh primitives; keep future foliage detail within a sensible browser budget.

## Boundaries

Preserve `.vercel` metadata. No deployment or merge was performed. The current request authorizes committing and pushing this handoff branch; it does not authorize publishing the site or implementing the next milestone.
