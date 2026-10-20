# Bedroom Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended by the skill) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. For this project, sequential root implementation is recommended below. The user's GPT-only policy controls delegation and requires two independent final reviewers; it overrides the skills' default model and reviewer choices.

**Goal:** Continue the accepted exterior into a detailed, cozy bedroom and settle on the desk plant and watering can, completing Milestone 2.

**Architecture:** Load a separate packed Blender room alongside the exterior. A single explicit camera story conceals the scene switch behind a linen veil, reveals the room, and settles at the desk. One renderer, semantic controls, bounded asset loading, and centralized teardown serve both scenes.

**Tech Stack:** Existing pinned Vite, strict TypeScript, Three.js, GSAP, and GLTFLoader; local Blender 4.5.14 LTS for asset authoring; Python standard library and the already available Playwright installation for focused verification.

**Spec:** `docs/superpowers/specs/2026-10-20-bedroom-reveal-design.md`, approved 2026-10-20. Read with `AGENT.md` and `docs/PROJECT_SPEC.md`; the approved M2 addendum supplies the current milestone scope and Blender extension.

## Global Constraints

- “The room should have the same modeled finish as the accepted exterior.”
- “M2 ends in `Desk settled`; it does not claim that watering works.”
- “Use an opaque, warm linen veil only during the concealed switch.”
- “The existing semantic `Bỏ qua phần mở đầu` button remains usable throughout the reveal.”
- “For `prefers-reduced-motion`, show the desk pose once the room is ready, without long travel, curtain sweep, ambient sway, or a forced room tour.”
- “Merge static repetitions by material where possible.”
- “Serve all geometry and textures locally, packed into the GLB.”
- “Do not introduce remote assets, downloaded models with unclear provenance, new runtime dependencies, texture compression extensions requiring a new external decoder, or a font CDN.”
- Room limits: 60,000 triangles, 50 mesh primitives, and 6 MB; interpret the byte ceiling conservatively as 6,000,000 bytes.
- Keep one renderer, DPR cap 1.5, bounded shadows, explicit resource disposal, semantic controls, and a usable WebGL fallback.
- Preserve user changes, the accepted exterior asset, `.vercel`, and deployment configuration. Do not deploy or merge.
- Do not implement watering input/timing, bloom, greeting card/dialog, audio, or personalization.
- Focused regression coverage is authorized by the approved M2 design. Do not add a general test framework or app runtime dependency.
- Report evidence as `PASS`, `FAIL`, or `NOT_RUN` on the actual revision checked. A desktop portrait viewport is not a physical-phone measurement.

## Review Focus

- Skip requested before either model is ready must eventually select the desk, or exterior arrival on room failure; pin this in Task 4.
- A room timeout during image decode must reject promptly and dispose a late parsed result; pin this in Task 2.
- Resize or reduced-motion changes at the concealed handoff must not expose a scene switch or leave an opaque veil; pin this in Tasks 3–4.
- A retry after room failure must create one fresh request without replaying the exterior or producing competing timelines; pin this in Task 4.
- Teardown while the reveal or a retry is active must prevent late attachment and release resources once; pin this in Tasks 2–4.

## Files and boundaries

| File | Responsibility |
|---|---|
| `assets/blender/create-bedroom.py`, `bedroom.blend` | Repeatable authoring and editable room source |
| `public/models/bedroom.glb` | Packed room runtime asset |
| `assets/blender/README.md` | Room rebuild, coordinates, named nodes, actual asset measurements |
| `src/scene/assets/load-packed-glb.ts` | Shared local packed-file parsing and cancellation for the two concrete loaders |
| `src/scene/assets/load-bedroom-model.ts` | Bedroom node/hierarchy validation and typed imported handles |
| `src/scene/assets/load-exterior-model.ts` | Preserve exterior validation/API while using shared parse/cancellation helper |
| `src/scene/interior/build-bedroom.ts` | Room assembly, local lights, framing and animation targets |
| `src/experience/camera-story.ts` | One phase model and camera/veil timeline, skip, resize, motion changes |
| `src/ui/intro-controls.ts`, `src/styles.css` | Status, skip, retry, opaque linen veil and responsive controls |
| `src/scene/create-scene.ts` | Explicit exterior/interior shared-light configuration |
| `src/main.ts` | Parallel asset lifecycle, retry, group activation, render loop and teardown |
| `tests/validate_bedroom_glb.py` | Standard-library asset contract/count checks |
| `tests/bedroom_browser.py` | Focused browser regressions using Python unittest and existing Playwright |
| `docs/HANDOFF.md` | Actual final milestone state, run/rebuild instructions, evidence and limitations |

Do not change the exterior authoring script or GLB to implement the hidden handoff. Existing `disposeObjectResources` remains the resource cleanup utility; modify it only if a demonstrated M2 ownership problem requires a focused correction.

## Interface contracts

Use the existing `CameraPose` and `CameraPosePair` shapes for exterior poses. Add `BedroomPoses = { entry: CameraPose; room: CameraPose; desk: CameraPose }` in the story module.

`load-packed-glb.ts` exports `loadPackedGlb(url: string, signal: AbortSignal, label: string): Promise<THREE.Group>`. The caller owns the deadline. The helper rejects nonlocal/unpacked input and races parsing against cancellation; it owns disposal of a result arriving after cancellation. A successfully returned group becomes the caller's responsibility.

`load-bedroom-model.ts` exports `loadBedroomModel(url: string, signal: AbortSignal): Promise<ImportedBedroom>`. Define `ImportedBedroom` as `{ group: THREE.Group; nodes: Record<BedroomNodeName, THREE.Object3D> }`, where the name union consists exactly of the twelve names in Task 1. Validation failure disposes the parsed group before rejecting.

`build-bedroom.ts` exports `buildBedroom(model: ImportedBedroom): BedroomBuildResult`, returning `{ group: THREE.Group; swayTargets: THREE.Object3D[]; cameraPoses(aspect: number): BedroomPoses }`. Keep anchors and furniture under this group's documented room-local origin. It owns no DOM, request, timeline, or second render loop.

Extend `SceneRuntime` with `setLocation(location: 'exterior' | 'bedroom'): void` to switch existing shared lights/background/fog/environment intensity explicitly. Keep one owned environment target; do not create a new PMREM each transition. Bedroom-specific practical lights belong to the bedroom group.

Extend `CameraStoryHandle` with `setBedroom(getPoses: (aspect: number) => BedroomPoses): void`, `setBedroomUnavailable(): void`, and `setReducedMotion(value: boolean): void`. Keep `skip()`, `reframe()`, and `dispose()`. `createCameraStory` retains its camera and exterior-pose arguments and takes options `{ reducedMotion: boolean; onPhase?: (phase: StoryPhase) => void; onLocation?: (location: 'exterior' | 'bedroom') => void; onVeil?: (opacity: number) => void; onError?: (error: unknown) => void; onArrive?: () => void }`. Keep the existing `onArrive` notification at exterior arrival so the current startup still compiles and runs in Task 3; Task 4 supplies all M2 hooks and stops using that legacy notification. Omitted callbacks are no-ops; room entry is only possible after `setBedroom`.

`StoryPhase` is `'exterior-intro' | 'window-arrival' | 'bedroom-reveal' | 'desk-settled' | 'bedroom-unavailable'`. Keep room readiness and the queued skip intent separate from phase. Arrival while the room is pending waits; `setBedroom` then proceeds, unless skip/reduced motion requests an immediate desk. `setBedroomUnavailable` preserves an active exterior intro, or selects exterior arrival immediately if skip/reduced motion already requested it. Repeated terminal operations are idempotent.

Extend `createIntroControls(onSkip: () => void, onRetry?: () => void)` to return `setStatus(message: string)`, `setRetryVisible(visible: boolean)`, `setVeil(opacity: number)`, `setSettled(settled: boolean)`, and `dispose()`. An omitted retry callback preserves the existing startup until Task 4; never show a retry button without a supplied callback. Settled/failure states may relabel the skip control truthfully or hide it after moving keyboard focus to a persistent status element; never leave focus on a removed/hidden button. The veil is decorative, opaque at 1, and under the controls.

## Task 1: Author and inspect the room asset

**Files:** New room authoring script, `.blend`, GLB, asset validator; extend asset README.

**Consumes:** Approved design and current Blender setup. **Produces:** Packed GLB with independently addressable transform roots `bedroom`, `room_shell`, `desk`, `plant_pot`, `plant_rest`, `watering_can`, `curtain_left`, `curtain_right`; empty leaf anchors `window_anchor`, `room_target`, `desk_target`, `pot_target`. All other named nodes descend from `bedroom`; no camera anchor descends from a movable curtain/can/plant root.

- [ ] **Step 1: Establish tool paths and asset checks.** Locate the existing Blender 4.5.14 executable from the task's `work/tools/` and run `--version`. Set task-local `$blenderExe` and `$gardenPythonExe`; do not overwrite system variables. Confirm `& $gardenPythonExe -c "import playwright.sync_api"` succeeds. Write `tests/validate_bedroom_glb.py` using only the standard library. Its checks include:

```python
assert byte_count <= 6_000_000
assert triangle_count <= 60_000
assert primitive_count <= 50
assert all(node_names.count(name) == 1 for name in required_nodes)
assert all('uri' not in item for item in buffers + images)
assert required_roots_have_geometry and anchors_are_empty_leaves
assert finite_transforms and valid_hierarchy and no_exported_camera_or_light
```

Run `& $gardenPythonExe tests/validate_bedroom_glb.py`; expect a missing-asset failure before authoring. Count actual triangles, including primitive indices and mode; reject unsupported primitive modes rather than silently undercounting.
- [ ] **Step 2: Author room composition.** Use X-right/Y-up/Z-front modeling coordinates converted to Blender as in the exterior script. Set floor Y=0, rear wall Z=-1.8, camera-facing opening toward +Z; start with a room approximately 5.6 wide and 4.4 deep. Place rear window around `(1.05, 2.15, -1.8)`, desk center around `(1.15, 0.95, -0.95)`, bed along the left wall, and shelf/rug as specified. These initial dimensions are camera tuning values, not permission to change visual requirements.
- [ ] **Step 3: Finish furniture and focal props.** Model beveled oak joinery, rounded bedding/pillows and folds, curtain pleats, rug thickness, lamp, few books/picture, hollow ceramic pot/soil/seedling, and rounded sage can with distinct handle and spout. Group repeated static pieces by material; keep named animation roots separate. Pack restrained local image maps and glTF-compatible materials. Save source preview rig only in `.blend`.
- [ ] **Step 4: Export and measure.** Run `& $blenderExe --background --factory-startup --python assets/blender/create-bedroom.py`. Run the validator; expect exit 0 and actual bytes/triangles/primitives/node data. Render a Blender source preview, inspect the focal props and furniture finish, and correct asset problems before runtime integration. Document rebuild command, actual node types, coordinates and measured counts in README.
- [ ] **Step 5: Save this independently reviewable asset slice.** Confirm the exterior GLB hash still matches the baseline; run `git diff --check` and commit only Task 1 files with `feat: author cozy bedroom assets`. Later real-render inspection may still require asset corrections.

## Task 2: Load and assemble the bedroom safely

**Files:** Shared packed loader, bedroom loader, exterior loader, room builder, browser regression file.

**Consumes:** Task 1's node contract and the existing resource disposer. **Produces:** The three loader/builder contracts above. The room builder returns a hidden, fully assembled group suitable for adding to the existing scene.

- [ ] **Step 1: Write focused failing loader checks.** In `tests/bedroom_browser.py`, use unittest/Playwright against a local Vite URL supplied by `GARDEN_TEST_URL`. Import the dev-served TS loader modules in an isolated page; do not expose a production debug global. Add checks named `test_valid_room_contract`, `test_invalid_room_nodes`, `test_packed_local_resources`, `test_abort_during_parse`, and `test_exterior_loader_regression`. Assert valid geometry/unique handles; rejection for missing/duplicate roots, empty mesh, invalid transform/hierarchy, external URI, and failed HTTP. For delayed image decode, assert cancellation rejects within 500 ms of abort and a late parsed scene's resources are disposed once. Assert the existing exterior contract still returns its six required handles. Run the selected checks and record the expected initial missing-module failures.
- [ ] **Step 2: Implement shared parsing and bedroom validation.** Extract only the common fetch/parse/cancellation behavior from the exterior loader into `loadPackedGlb`. Reject nonlocal redirects and packed-file violations before any external resource is requested. Preserve exterior validation and return shape. Validate Task 1 node uniqueness, geometry, finite transforms, usable scale, hierarchy, and empty anchors in the room loader. Set cast/receive shadows with the same transparent-material precautions as the exterior.
- [ ] **Step 3: Implement room framing.** Build around the model's actual anchors. Start the landscape room camera around `(6, 4.5, 7.2)` looking toward room center and the desk camera around `(3.3, 2.5, 3.6)` looking at the pot/can group. Derive distinct portrait poses from actual bounds and free UI space. Preserve window context and both focal props; keep future flower space above the pot. Add one bounded non-shadow-casting lamp light if the render needs it.
- [ ] **Step 4: Verify this slice.** Run the Task 2 browser checks, `npm run typecheck`, and `npm run build`; expect exit 0. Browser fixture edits stay in memory or temporary files, never in production assets. Record cancellation/cleanup observations and any console diagnostics. Commit focused source/check files with `feat: load and assemble bedroom scene`.

## Task 3: Implement the guided reveal and semantic controls

**Files:** Camera story, controls, styles; extend browser checks.

**Consumes:** Existing exterior poses and Task 2 bedroom poses. **Produces:** Extended story/control contracts above; no orchestration of network requests in these modules.

- [ ] **Step 1: Write failing phase/veil checks.** Add isolated browser-module checks `test_story_waits_for_room`, `test_skip_and_motion_idempotence`, `test_handoff_is_covered`, and `test_story_disposal`. Drive the actual GSAP timeline using controlled browser time/GSAP advancement. Assert:

```python
assert locations_at_switch == [('bedroom', 1.0)]  # location, veil opacity
assert pending_room_phase == 'window-arrival'
assert early_skip_then_room_phase == 'desk-settled'
assert repeated_skip_location_switches == 1
assert reduced_motion_veil_max == 0
assert failed_room_location == 'exterior'
assert resize_does_not_restart_or_change_phase
assert no_callbacks_after_dispose
```

Also cover turning reduced motion on at partial cover and immediately before the switch: final desk/exterior is correct, veil is zero, and no older timeline resumes. Run checks against the current story and record initial failures.
- [ ] **Step 2: Implement one phase/timeline owner.** Preserve the six-second exterior approach. At arrival, wait for room readiness or start the reveal. Keep forward travel outside solid glazing; bring the veil to full opacity before calling `onLocation('bedroom')` and selecting the entry pose. Reveal into the room, hold about one second, then ease over about three seconds to the desk. Use approximately 1.5 seconds for the covered handoff and tune by inspection. Apply resize through the active phase and normalized progress, not by starting new tweens. Kill old work before skip, recovery, motion preference changes, or dispose.
- [ ] **Step 3: Implement the UI contract.** Keep all Vietnamese status/control copy in the UI layer. Add a nonfocusable linen veil with full opacity at its covered state, no pointer interception, and no animation under reduced motion. Keep visible keyboard focus and minimum 44px control targets. Add the retry control and truthful terminal skip behavior. The final status is `Một chiếc bình tưới đang chờ cạnh chậu cây.`; do not add a watering button or progress bar.
- [ ] **Step 4: Verify story and control behavior.** Run Task 3 checks and build/typecheck. Check keyboard skip and focus after settlement and failure; actual camera visual inspection remains Task 5. Commit this slice with `feat: choreograph bedroom reveal`.

## Task 4: Integrate loading, light switching, retry, and teardown

**Files:** `main.ts`, `create-scene.ts`; extend browser checks.

**Consumes:** Tasks 2–3 APIs. **Produces:** A complete M2 route from startup to desk, with usable exterior recovery.

- [ ] **Step 1: Write failing experience regressions.** Add `test_normal_progression`, `test_early_repeated_skip`, `test_room_failures_and_retry`, `test_resize_and_motion_change`, `test_teardown_during_retry_and_reveal`, and `test_webgl_fallback`. Serve actual assets and use Playwright route fixtures for missing/malformed/missing-anchor/delayed room responses. Assertions include:

```python
assert normal_final_status == 'Một chiếc bình tưới đang chờ cạnh chậu cây.'
assert final_veil_opacity == 0 and final_veil_blocks_pointer is False
assert queued_skip_reaches_desk_without_replaying_intro
assert room_failure_keeps_exterior_and_shows_retry
assert retry_request_count == initial_request_count + 1
assert late_failure_does_not_replace_successful_retry
assert teardown_canvas_count == 0 and no_late_attachment
assert webgl_failure_has_visible_vietnamese_message
assert unexpected_page_errors == [] and external_requests == []
```

Exercise skip both before exterior selection and during room delay. Delay parsing beyond the 12-second room deadline; expect exterior recovery and a functioning retry. Resize during exterior travel, partial veil cover, room reveal, and desk settling; assert completion once and capture the relevant frame. Record actual baseline failures before integration.
- [ ] **Step 2: Integrate room loading alongside the exterior.** Begin both requests without making the exterior await the room. Apply a 12-second deadline per attempt including decode; track each attempt's identity/controller to reject stale outcomes. Feed room readiness/failure to the story. Retry disables itself while pending, starts exactly one fresh room request, and keeps the current exterior arrival instead of replaying startup. Handle errors after full cover by restoring the exterior arrival and clearing the veil.
- [ ] **Step 3: Switch active groups and light explicitly.** Keep only the active scene group visible. Implement `setLocation` with coherent warm interior fill/background/fog/exposure values; keep the same environment target and one renderer. Hide exterior-only point light with the exterior group. Use room-local lamp fill without extra shadow maps. Apply ambient curtain/foliage motion only when the current preference permits it, including runtime preference changes.
- [ ] **Step 4: Complete teardown ownership.** Register cleanup before asynchronous loading. Abort both attempts, clear all deadlines, stop story/sway/veil work, disconnect resize and media-query listeners, remove controls, and dispose the runtime once. Dispose validated but unattached late models immediately; attached assets belong to scene disposal. Ensure retry and recovery cannot double-dispose shared resources or leave a live animation behind.
- [ ] **Step 5: Run the complete focused browser suite, typecheck and production build.** Expect exit 0 and no unexpected page errors. Preserve known shader/build warnings distinctly. Commit with `feat: integrate recoverable bedroom experience`.

## Task 5: Inspect the real render and finish review

**Files:** Adjust only assets, framing, lighting, styles, or lifecycle code supported by actual findings. Update asset README and `docs/HANDOFF.md` with the delivered M2 state.

**Consumes:** Working Tasks 1–4. **Produces:** User-reviewable local preview, actual captures, and revision-bound verification/review evidence.

- [ ] **Step 1: Inspect production stills and the transition.** Run `npm run preview -- --host 127.0.0.1`; use the port it actually reports. Capture exterior establishing/arrival, room view, and desk at 1440×900 and 390×844. Inspect the cover/switch/uncover sequence as closely spaced frames or video. Correct exposed clipping, pose discontinuity, furniture blockiness, dark or blown-out surfaces, pot/can overlap, cropped focal props, and controls covering the subject. Tune asset and camera together; rerun affected checks after corrections.
- [ ] **Step 2: Measure actual resource use.** Rerun the GLB validator, record its hash/counts and runtime draw calls/triangles for room and desk, inspect local requests, and assess animation pacing. Keep within approved room limits. Report physical-phone performance `NOT_RUN` unless a real phone is available and measured.
- [ ] **Step 3: Freeze and verify the final revision.** Record baseline HEAD, final source/asset manifest and SHA-256, and spec/plan/GLB hashes in the task evidence. Run `npm run typecheck`, `npm run build`, `git diff --check`, asset validation, and the relevant production browser checks. Dev-only module tests may use the dev server; mark that distinction. Repeat only affected checks after a relevant change. Report shader precision and chunk-size warnings accurately.
- [ ] **Step 4: Obtain the required independent reviews.** Check native Codex availability for `gpt-6-luna` with `high` or `xhigh`. Dispatch two separate read-only reviewer tasks on the same frozen files, with self-contained briefs and no shared current-round findings. Record actual resolved model/effort when exposed; otherwise mark unknown. Model rejection blocks dependent review and must be preserved without fallback. Reconcile findings only after both finish; fix supported issues and repeat affected verification and both reviews for the changed revision. Review instructions do not create a technical sandbox.
- [ ] **Step 5: Hand over the local result.** Update `docs/HANDOFF.md` with the current M2 endpoint, exact rebuild/check commands, actual outcomes, warnings, remaining M3 decision, and commit/review identifiers. Show the actual desktop and portrait captures and keep the local preview available. Save final local commits; push/publishing follows the user's applicable authorization. Do not merge or deploy. User visual acceptance is separate from successful builds and code reviews.

## Plan self-review

- Room composition, furniture/material finish, named nodes, local packing and limits: Task 1; checked again in Task 5's actual render.
- Validation, cancellation during decode, external-resource rejection, framing and ownership: Task 2.
- Concealed handoff, explicit phases, skip, reduced motion, resize and accessible controls: Task 3.
- Concurrent loading, deadline, retry, light activation, error restoration and teardown: Task 4.
- Desktop/portrait sequence inspection, measurements, frozen evidence, two independent reviews and handoff: Task 5.
- The interfaces used by later tasks match the contract section. No future watering/card subsystem or additional runtime dependency is introduced. All checklist items describe planned work; none is reported as executed.

## Execution handoff

**Recommended method:** root implements these five tasks sequentially in this chat using `superpowers:executing-plans`, then obtains both independent final reviews required by the user's GPT-only policy. Model authoring, camera placement, light and concealment need tight iteration; splitting implementation across fresh workers would add coordination without much independent parallel work.

Alternative: sequential subagent implementation using `superpowers:subagent-driven-development`, with every delegate restricted to `gpt-6-luna` at `high` or `xhigh` and task reviews plus the two final independent reviews. Availability failures remain blockers; no provider/model fallback is allowed.

The user approved the written M2 design. Review of this implementation plan and selection of its execution method are pending; product implementation has not begun.
