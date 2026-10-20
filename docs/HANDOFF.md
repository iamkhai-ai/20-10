# Milestone 2 handoff

## Current delivered scope

The user approved the M2 design and implementation plan on 2026-10-20.
The local `codex/bedroom-reveal` branch now continues the accepted exterior
through a concealed linen-covered transition into a Blender-authored
bedroom. It reveals the bed, rug, shelf, lamp and desk, then settles on
the potted seedling and sage watering can. The can is a prop; watering,
bloom and greeting-card behavior are later milestones.

**Verified/reviewed source revision:** `9fbb98d2ccc46536e2192ec4e20f728c54401c5f`.
The final handoff commit changes documentation only, preserving that
source/asset revision and its evidence. M1 baseline: `93244d0`.

Read `AGENT.md`, the approved M2 design at
`docs/superpowers/specs/2026-10-20-bedroom-reveal-design.md`, and its plan
at `docs/superpowers/plans/2026-10-20-bedroom-reveal.md`.

## Run, edit and check M2

```powershell
npm ci
npm run dev -- --host 127.0.0.1
npm run typecheck
npm run build
npm run preview -- --host 127.0.0.1
```

Use the port Vite actually reports. The task's production preview used
`http://127.0.0.1:4176/`; dev verification used port 5175.

- Room asset source/export: `assets/blender/create-bedroom.py`,
  `assets/blender/bedroom.blend`, and `public/models/bedroom.glb`.
- Blender version, node names, pivots and rebuild command:
  `assets/blender/README.md`.
- Packed fetch/parse cancellation: `src/scene/assets/load-packed-glb.ts`.
- Room validation and assembly: `load-bedroom-model.ts` and
  `src/scene/interior/build-bedroom.ts`.
- Camera phases and covered handoff: `src/experience/camera-story.ts`.
- Semantic skip/retry/status/veil: `src/ui/intro-controls.ts` and styles.
- Loading/retry/teardown and light activation: `src/main.ts` and
  `src/scene/create-scene.ts`.

Focused checks use Python's standard unittest runner with an existing
Playwright installation and Chrome; they add no app runtime dependency.
With a Vite dev server running:

```powershell
python tests/validate_bedroom_glb.py
$env:GARDEN_TEST_URL='http://127.0.0.1:5175'
python tests/bedroom_browser.py
```

For compiled production preview behavior, set `GARDEN_TEST_URL` to that
preview URL and run `python tests/bedroom_browser.py ExperienceChecks`.
Loader/story module checks require the dev server's TS module handling.

## Final M2 evidence

- **PASS:** typecheck and production build; final bundle
  `index-B6LR-9Es.js`, about 753.69 kB minified / 204.54 kB gzip.
- **PASS:** packed asset contract and limits. Room: 2,186,796 bytes,
  39,140 triangles, 29 primitives, 19 materials, 9 embedded images.
- **PASS:** 17 focused dev-browser checks (85.185 seconds), including
  loader validation, abort during decode, late disposal, exterior
  regression, covered switching, failure restoration, queued/repeated
  skip, live reduced-motion changes, resize, room failure/retry, decode
  deadline/retry, teardown during retry/reveal, and WebGL fallback.
- **PASS:** the seven experience checks on compiled production preview
  (70.859 seconds).
- **PASS:** desktop 1440×900 and portrait 390×844 establishing, arrival,
  room and desk captures; sampled cover/switch/uncover sequence inspected;
  no unexpected JavaScript errors or external resource requests observed.
- **PASS:** two independent read-only reviews of the same frozen source
  revision, both with no actionable findings. Requested model/effort:
  `gpt-6-luna` / `high`; resolved runtime settings were not exposed.
  Both reviewers share the requested model family, so correlated blind
  spots remain possible. Their reviews did not rerun runtime gates.
- **FAIL:** warning-free desktop console; the pre-existing driver shader
  precision warning X4122 persists. Portrait capture had no warnings.
- **NOT_RUN:** physical-phone performance and full-video temporal review.
  Stills and covered-switch regressions bound the continuity evidence;
  user visual acceptance remains separate from technical checks.

GLB SHA-256:
`c8e614b801a0c41a7e11d1f7f3a275f4e62eea8876a042f1e13bb79f0776b2f6`.
Frozen Git-blob manifest SHA-256:
`679d81dc72b499c7e503c3264bfdb820d5dd2e59b5f2c5eebdd6d9a4e1cb1afc`.
The manifest covers runtime source, assets, tests and current requirements;
the handoff report itself is excluded.

Measured GL submissions include color and shadow passes: room and desktop
desk 58 draws / 78,280 triangles; portrait desk 52 / 73,104. These are
scene submission counts, not a physical-device frame-rate guarantee.
Vite's JavaScript chunk-size warning remains.

## Recovery and next milestone

Both assets begin loading independently. Each request/parse attempt has a
12-second deadline. Room failure leaves the exterior usable and offers
one retry; stale/aborted parse results are disposed. Skip goes to the desk
when the room is ready, or the exterior arrival when it is unavailable.
Reduced motion bypasses the tour and sway. A resize preserves the active
phase; teardown stops camera/sway, aborts requests and releases resources.

For M3, first settle the spec's outstanding watering-time decision:
preserve accumulated valid watering time when paused, or reset it.
Keep the can/pot/plant nodes independent and respect the current asset
coordinates. Do not reintroduce a nonfunctional watering control into M2.
The exterior asset is unchanged. `.vercel` is preserved. No merge,
deployment or M2 remote push was performed.

---

# Historical Milestone 1 handoff

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
