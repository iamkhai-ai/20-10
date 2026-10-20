# Milestone 3 watering — current local handoff

The user approved the M3 design, written spec and concrete implementation plan,
choosing sequential execution in this chat. The implementation is local on
`codex/watering-feature`. Reviewed and verified runtime source:
`cee05c47041c923cc29272886329ea67c9750fac`.
The later handoff documentation commit preserves that source and its assets.
No M3 push, merge, deployment or M4 implementation is included.

## Delivered behavior

- After the bedroom reaches the settled desk, drag the pastel-blue can toward
  the planter or activate the native **Tưới cây** button. Mouse, touch,
  Enter/Space and assistive-technology clicks use the same progress owner.
- Only a downward nozzle aimed into the soil emits water and accumulates time.
  Five valid seconds complete once. Pauses and invalid aim preserve the total;
  alignment, return and inactive intervals add no credit.
- Release, cancellation, capture loss, focus loss, hidden page, Escape, resize,
  live motion-preference changes and teardown stop the action safely.
- A thin stream, 16 instanced drops, local soil wetness and restrained plant
  feedback accompany watering. Reduced motion uses immediate can poses and a
  stable stream without animated drops or oscillation.
- A labeled native progress indicator, visible amount, pause/resume action and
  coarse status announcements provide a complete alternative to dragging.
  Completion returns the can and says **Cây đã đủ nước rồi.**
- The accepted room GLB, exterior, camera composition and M2 loading/retry/
  fallback behavior are preserved. No runtime dependency was added.

## M3 revision-bound evidence — 2026-10-20

All runtime checks below apply to `cee05c4`, with unchanged packed assets.

| Check | Result | Evidence |
|---|---|---|
| Strict TypeScript | PASS | `npm run typecheck`, exit 0 |
| Production build | PASS | `npm run build`, exit 0; `index-D_dN4-n9.js`, 766.81 kB / 209.04 kB gzip |
| Dev watering suite | PASS | 23 tests, 117.857 s |
| Dev bedroom regressions | PASS | 17 tests, 166.577 s |
| Compiled watering experience | PASS | 5 tests, 45.548 s |
| Compiled bedroom experience | PASS | 7 tests, 135.048 s |
| Packed bedroom validation | PASS | 4,871,584 bytes; 45,449 triangles; 37 primitives; 24 materials; 26 images |
| Actual desktop/portrait graphics | PASS | 1440x900 and 390x844; ready, held, pour, stop, return and complete; normal and reduced motion |
| Unexpected JavaScript errors / external requests | PASS | None in actual final capture routes |
| Warning-free desktop console | FAIL | Existing driver shader precision warning X4122 persists |
| Physical-phone FPS / full-video temporal review | NOT_RUN | Browser captures and submission samples do not establish these |

The tests cover state timing, valid/invalid aim, pointer ownership/cancellation,
real touch input, native keyboard controls, focus/visibility, resize/motion,
loading/retry, teardown and the existing bedroom story/fallback behavior.
Test-only harnesses do not expose a production debug global.

Sampled reduced-motion render submissions: desktop 71 calls / 90,504 triangles
at rest and 72 / 90,532 while pouring; portrait 64 / 74,676 and 65 / 74,704.
These are renderer submissions including existing scene passes, not asset
triangle counts or frame-rate measurements. Normal motion additionally uses
one bounded instanced droplet mesh. Vite's chunk-size warning remains.

Two independent read-only reviews of the same frozen revision completed with
**no actionable findings**: `/root/m3_review_a` and `/root/m3_review_b`.
Both checked the full source diff against the approved requirements and supplied
captures. Review A inspected a subset of the captures. Neither reran tests/build.
Requested settings were `gpt-6-luna` / `high`; resolved settings were not exposed
and remain unknown. Read-only was instructed, not technically enforced. Both
reviewers share a model family, so correlated blind spots remain possible.
The root ran the verification commands separately. User visual acceptance of
M3 remains separate from these technical results.

GLB SHA-256 remains
`d3050738274f5062507f7869ce90f8d4c5cfef1969d9bd5ea001f9d4770f0268`.
Exterior SHA-256 remains
`e548f10b90dab7cad02b5918e631438946d5d7e0812a7983d91e9662d78b4279`.
Existing caps remain 6,000,000 bytes / 60,000 triangles / 50 primitives.

Logs, final captures, raw measurements, review messages and the execution ledger
are saved in this Codex task's `outputs` directory with an `m3-` prefix.
The implementation was isolated in `.worktrees/watering-feature` using Git after
the app-native worktree tools returned `Transport closed`; no app-managed
worktree attachment is claimed. The final task report names the active checkout
and live preview. Preserve `.vercel` and deployment configuration.

## Continuing with M4

`createWateringInteraction` accepts an optional `onComplete` callback. It fires
once when valid watering reaches five seconds, after input and water stop.
M3 already handles completion status and can return without a consumer. Connect
the authored tulip growth/petal sequence and later card in the approved M4 scope;
no placeholder flower/card invitation or personal message exists in M3.

Reproduce checks with the existing installed tooling:

```powershell
npm run typecheck
npm run build
# Run dev and preview in separate terminals, using their actual reported ports.
npm run dev -- --host 127.0.0.1 --port 5180
$env:GARDEN_TEST_URL='http://127.0.0.1:5180'
python tests/watering_browser.py
python tests/bedroom_browser.py
npm run preview -- --host 127.0.0.1 --port 4176
$env:GARDEN_TEST_URL='http://127.0.0.1:4176'
python tests/watering_browser.py WateringExperienceChecks
python tests/bedroom_browser.py ExperienceChecks
python tests/validate_bedroom_glb.py
```

---

# Historical Milestone 2 visual refinement handoff

The user requested a more detailed, near-real warm bedroom, then refined
planter, wall, floor, quilt and watering-can appearance during review.
Current source/assets: `f426084a88fae72fe2d3969a44fcf2930738e5c1` on
`codex/bedroom-reveal`. The handoff documentation commit does not change
that verified/reviewed source. No M2 push, merge or deployment occurred.

## Current appearance

- Sewn cushions, shaped headboard, naturally draped milk-cream quilt and
  sage throw; long staggered blond oak floorboards and pale oak furniture.
- Clean mist-blue walls, light sage paneling and window-directed sunlight.
- Smooth rounded butter-yellow planter with cream rim/saucer and small
  rose flower motifs; shaped seedling leaves and loose soil detail.
- Compact oval pastel-blue can, one swept handle, fine long tapered spout,
  rolled brass filling rim and small perforated brass rose.
- Packed local albedo/normal/roughness maps on UV0 and static AO on UV1.
  Can, plant, curtains, glass and window backdrop do not cast permanent
  baked shadows. The backdrop does not block runtime daylight.

The M2 endpoint remains the settled desk. Watering, tulip bloom, greeting
card and personal message are later scopes. The exterior GLB is unchanged.
Read the current M2 design and `assets/blender/README.md` before edits.
The asset script and its `bedroom_surfaces.py` helper rebuild with Blender
4.5.14 LTS and its bundled NumPy; no new runtime dependency was added.

## Final revision evidence

- **PASS:** production build and its strict TypeScript check at the final
  source/assets. Bundle `index-D-NzPYsC.js`, 754.10 kB / 204.72 kB gzip.
- **PASS:** packed GLB validation: 4,871,584 bytes, 45,449 triangles,
  37 primitives, 24 materials, 26 embedded images. All caps are unchanged:
  6,000,000 bytes / 60,000 triangles / 50 primitives.
- **PASS:** 17 dev-browser regressions, 212.100 seconds; 7 compiled
  production experience checks, 148.614 seconds. Coverage includes nodes,
  local resources, abort/late disposal, covered handoff, skip, reduced
  motion, resize, room failure/decode deadline/retry, teardown and WebGL
  fallback. These runs use the final can/oak asset, replacing prior runs.
- **PASS:** actual 1440x900 and 390x844 final desk renders inspected. Full
  planter/can silhouettes and window context remain visible. No unexpected
  JavaScript errors or external requests observed.
- **PASS:** normal-flow approach/cover/uncover/room/desk frames inspected
  in both viewports. Final screencast sampling captured 150 desktop and
  341 portrait frames; selected visual full-cover frames conceal the
  handoff. This is sampled-frame evidence, not full-video assessment.
- **PASS:** two fresh independent read-only reviews of `f426084`, tasks
  `realism2_review_a` and `realism2_review_b`, with no actionable findings.
  Both checked the source/asset/actual final frames. Requested settings:
  `gpt-6-luna` / `high`; resolved settings were not exposed. Reviews did not
  rerun builds/tests; read-only was instructed, not runtime-enforced.
  Both share a model family, so correlated blind spots remain possible.
- **FAIL:** warning-free desktop console; the existing driver shader
  precision warning X4122 persists. Portrait capture had no warnings.
- **NOT_RUN:** physical-phone performance and full-video temporal review.
  Viewport captures and submission counts do not establish phone FPS.

GLB SHA-256:
`d3050738274f5062507f7869ce90f8d4c5cfef1969d9bd5ea001f9d4770f0268`.
The original exterior GLB SHA remains
`e548f10b90dab7cad02b5918e631438946d5d7e0812a7983d91e9662d78b4279`.
Vite's JavaScript chunk warning remains. One attempted capture overlapped
with a build clearing `dist`; it failed with an HTTP response error. The
build completed and the subsequent final capture passed.

Prior review of `27ce926` raised one P2: the desk was too dark/red for the
pale-oak design. The lighter/desaturated wood in `f426084`, actual final
frames and both new reviews resolve that finding. No waiver was used.
Older measurements/reviews below describe historical revisions only.
User visual acceptance remains separate from these technical results.

Preview: `http://127.0.0.1:4176/`. Refresh after a new local build.
Use the existing commands below for rebuilding and regression checks.
The user subsequently requested M3 and selected preservation of accumulated
valid watering time on pause. The in-chat interaction flow is approved;
the detailed design at
`docs/superpowers/specs/2026-10-20-watering-interaction-design.md` is now
approved for implementation planning. Plan review precedes product-code
changes. M3 code has not begun.
The concrete plan is
`docs/superpowers/plans/2026-10-20-watering-interaction.md`; it awaits user
review and execution-method selection.

---
# Historical Milestone 2 initial handoff

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
