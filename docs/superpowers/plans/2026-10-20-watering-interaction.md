# Milestone 3 Watering Interaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for sequential root execution, or superpowers:subagent-driven-development if the user selects delegated execution. Implement task-by-task; steps use checkbox syntax. The personal policy requires two independent final read-only reviewers and overrides any weaker single-review guidance.

**Goal:** Let the visitor drag or activate the accepted can to water the plant for five accumulated valid seconds, preserving progress on pause and completing once.

**Architecture:** A pure state/timing model serves both input routes. A room view owns calibrated can poses, aim and reusable water/feedback effects; a coordinator binds canvas input, semantic controls and the existing render loop. M2 retains camera/loading ownership; watering becomes available only at the settled desk.

**Tech Stack:** Existing Vite, strict TypeScript, Three.js and GSAP; existing Python unittest/Playwright/Chrome for focused browser coverage.

**Spec:** `docs/superpowers/specs/2026-10-20-watering-interaction-design.md`, approved by the user on 2026-10-20.

## Global Constraints

- Preserve accumulated valid watering time on every pause; completion is exactly 5,000 ms of valid action and emitted once.
- No water or time credit before settlement, while aiming/returning, off target, hidden/unfocused, interrupted, unavailable, disposed or complete.
- Support mouse/touch drag and native button activation with Enter/Space; one input owner at a time.
- Preserve the accepted M2 room/can/planter appearance and local packed assets. No new runtime dependency, remote asset, extra render loop, fluid library, post-processing chain or shadow-casting water light.
- Use at most 24 reusable/instanced droplets plus a thin stream; avoid per-frame resource allocations. Reduced motion uses immediate poses/stable stream with no moving droplets or wobble.
- Resize, motion changes, blur, hidden page, Escape, lost capture, cancellation and teardown stop water and preserve progress.
- Keep Vietnamese copy in the UI layer, semantic progress, restrained announcements, visible focus and at least 44px control targets.
- M3 completes with a one-shot bloom-start handoff; authored tulip/card behavior is M4. No fake flower sequence, persistence, merge, remote push or deployment.
- Use repository typecheck/build and actual desktop/portrait renders. Report PASS/FAIL/NOT_RUN for the actual revision. Existing X4122 and Vite chunk warnings remain separately recorded.
- Subagents, if authorized/required, must use native `gpt-6-luna` with `high` or `xhigh`; verify availability, preserve errors and never fall back. Actual resolved settings are unknown unless exposed.

## Review Focus

1. A second pointer or repeating Enter arrives during an active action: it cannot steal ownership or toggle rapidly. Pin in Task 4 input tests and Task 3 button tests.
2. Pointer-up is missed because the window loses focus or the page becomes hidden: water stops and hidden time is never credited. Pin in Tasks 1 and 4.
3. Canvas CSS size/offset, DPR or orientation changes: picking uses its actual bounds, and resize pauses before reframing without resetting progress. Pin in Tasks 4 and 5.
4. The user skips early/repeatedly while the room loads/retries: watering stays inactive until one usable settled room exists. Pin in Task 5 integration tests.
5. An input route takes over while alignment/return is running: old animation/input cannot resume, double-count, or emit completion twice. Pin in Tasks 2 and 4.

## Files and interfaces

Create four focused production modules: `src/experience/watering-state.ts`, `src/experience/watering-interaction.ts`, `src/scene/interior/build-watering.ts`, and `src/ui/watering-controls.ts`. Modify `build-bedroom.ts`, `main.ts` and styles only where needed. Add `tests/watering_browser.py` and `tests/watering-harness.ts` using the existing test-only Three/GSAP dependency identity. No production debug global or new test framework.

### State contract (Task 1)

```ts
type WateringMode = 'none' | 'drag' | 'button';
type WateringPhase = 'unavailable' | 'ready' | 'aiming' | 'watering' | 'paused' | 'complete';
interface WateringSnapshot {
  phase: WateringPhase; mode: WateringMode; available: boolean;
  elapsedMs: number; progress: number; complete: boolean;
}
interface WateringState {
  setAvailable(available: boolean, now: number): void;
  setAction(mode: WateringMode, now: number): void;
  setAim(valid: boolean, now: number): void;
  advance(now: number): Readonly<WateringSnapshot>;
  pause(now: number): void;
  snapshot(): Readonly<WateringSnapshot>;
  dispose(): void;
}
function createWateringState(onComplete?: () => void): WateringState;
```

Time values are monotonic milliseconds. Mutations integrate the preceding valid interval before changing eligibility. Keep a stable read-only snapshot object rather than allocating it every frame. Pause clears input/aim and resets the timing baseline; it preserves elapsed time. Repeated enable calls never reset progress. Terminal completion blocks future actions/callbacks.

### Room view contract (Task 2)

Export `BedroomWateringRig` from `build-bedroom.ts` with `room: THREE.Group`, `can/pot/plant/outlet/soilTarget: THREE.Object3D`, `outletDirection: THREE.Vector3` in can-local coordinates, and `soilRadius: number`. Add `watering: BedroomWateringRig` to `BedroomBuildResult`.

```ts
interface WateringView {
  beginDrag(): void;
  drag(ray: THREE.Ray): void;
  aimAutomatically(): void;
  cancel(immediate: boolean): void;
  isValidAim(): boolean;
  render(now: number, pouring: boolean, progress: number): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}
function createWateringView(rig: BedroomWateringRig,
  options: { reducedMotion: boolean }): WateringView;
```

The view consumes rays, not DOM coordinates. It owns at most one can-pose tween; cancellation hides water first. It does not remove/dispose shared GLB resources. It removes and disposes its own effects, then leaves the room safe for scene disposal.

### Controls and coordinator contracts (Tasks 3–4)

```ts
interface WateringControls {
  setVisible(visible: boolean): void;
  render(snapshot: Readonly<WateringSnapshot>): void;
  dispose(): void;
}
function createWateringControls(options: {
  onToggle: () => void; onPause: () => void;
}): WateringControls;

interface WateringInteraction {
  setAvailable(value: boolean): void;
  update(now: number): void;
  pause(): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}
function createWateringInteraction(options: {
  canvas: HTMLCanvasElement; camera: THREE.PerspectiveCamera;
  bedroom: BedroomBuildResult; reducedMotion: boolean;
  onComplete?: () => void;
}): WateringInteraction;
```

The coordinator creates/owns one state, view and controls instance; callbacks use `performance.now()` in the same time domain as the render timestamp. The optional completion callback is the M4 connection point, not an empty M4 implementation. Completion UI/return already work when no downstream flower consumer is attached.

## Execution preparation

- [ ] Read the approved spec, canonical `AGENT.md`, this plan and complete personal policy. Confirm a clean branch and inspect attached worktrees before deciding isolation through `using-git-worktrees`. Reuse a suitable checkout; preserve `.vercel` and user changes. Current design branch is `codex/watering-interaction` based on accepted M2.
- [ ] Record scope, current revision, verification paths and pending gates in the Codex task. Update canonical current-scope guidance only after plan approval. Do not invent approval/model/check results.
- [ ] Use existing installed tooling. Start a dev server for module checks and a production preview for compiled checks; record their actual ports. Do not assume a previous turn's server remains alive.

## Task 1: Accumulated watering state and time

**Files:** Create `src/experience/watering-state.ts`, `tests/watering_browser.py`, `tests/watering-harness.ts`.

**Consumes:** No DOM/Three/GSAP. **Produces:** the State contract above; `StateChecks` in the Python suite and a test-only probe in the harness.

- [ ] **Step 1: Write failing `StateChecks`.** Assert unavailable/aiming/paused time is zero, repeated availability does not reset, and pause/resume works. Concrete sequence: available/drag/valid at 0; advance to 2,200 gives 2,200 ms; invalidate at 2,200 and advance to 4,200 stays 2,200; revalidate at 4,200; advance to 6,999 gives 4,999 without completion; advance to 7,000 gives exactly 5,000 and one completion. Repeated input/advances leave count one. Include mode transfer, hidden-style pause/resume, different frame cadences, and no callback after dispose.
- [ ] **Step 2: Run `python tests/watering_browser.py StateChecks` against Vite.** Record the actual missing-module/API failure; do not infer a RED result.
- [ ] **Step 3: Implement `createWateringState`.** Centralize elapsed accounting, eligibility and terminal completion; no interval timer, animation or DOM. A pause invalidates the old baseline so inactive time cannot catch up. Progress is clamped to `[0,1]`; no negative time credit.
- [ ] **Step 4: Run StateChecks, `npm run typecheck` and `npm run build`.** Expect exit 0 and all assertions passing. Record actual results.
- [ ] **Step 5: Commit `feat: track accumulated valid watering time`.** Keep UI/model changes for later tasks.

## Task 2: Calibrated can poses, aim and bounded water view

**Files:** Modify `src/scene/interior/build-bedroom.ts`; create `src/scene/interior/build-watering.ts`; extend `tests/watering-harness.ts` and `ViewChecks` in the Python suite. Document calibration in `assets/blender/README.md`.

**Consumes:** existing validated `ImportedBedroom`, named can/pot/plant roots and test-harness Three/GSAP identity. **Produces:** `BedroomBuildResult.watering` and the Room view contract.

- [ ] **Step 1: Write failing ViewChecks.** Load the actual packed GLB, build the rig and assert: rest aim invalid; outlet tracks can transforms; reduced-motion automatic alignment has a downward outlet above soil and impact within the inner disk; outside-disk/upward/below-rim cases invalid; `cancel(true)` restores exact rest position/quaternion and turns emission off. Temporary wobble restores on pause; soil wetness follows preserved progress. Disposal restores saved material values and releases owned effects once while retaining GLB resources. Assert no more than 24 drop instances and one active pose tween after takeover.
- [ ] **Step 2: Run `python tests/watering_browser.py ViewChecks`.** Record the missing view/rig failure.
- [ ] **Step 3: Expose calibrated runtime anchors and implement `createWateringView`.** Create outlet/soil anchors once, without changing GLB geometry or the loader's required-node contract. Baseline outlet is near room `(1.407,1.525,-.85)`, can pivot `(1.91,1.085,-.85)`, soil near `(1.10,1.405,-.88)`. Use an inner receiving radius of `.14` room units; derive points/direction through current world transforms. Store rest transforms once. Map manual rays onto a bounded desktop region; a forgiving near-pot zone guides the can to a calibrated pouring pose, then the final nozzle-to-soil test decides validity. Tune pose/ray-path clearance from actual renders, not just a screen-space hit.
- [ ] **Step 4: Implement the stream/drops and restrained feedback.** Reuse geometry/materials, one stream and at most 24 instanced drops, with preallocated scratch objects and no shadow casting. Emit only when `pouring && isValidAim()`; stop immediately on cancel. Keep soil wetness local. Reduced motion has immediate poses, a stable stream and no animated drops/wobble. Kill a prior pose tween before a new owner/return begins.
- [ ] **Step 5: Run ViewChecks, StateChecks, typecheck/build and actual ready/held/pouring/return renders.** Inspect full can, visible water impact and plant/rim clearance in both viewport shapes; fix actual findings. Commit `feat: animate calibrated watering can and water` with the calibration documentation. No new Blender export is expected unless evidence requires one.

## Task 3: Semantic watering controls and status

**Files:** Create `src/ui/watering-controls.ts`; modify `src/styles.css`; extend harness/`ControlChecks`.

**Consumes:** `Readonly<WateringSnapshot>` from Task 1. **Produces:** the Controls contract and centralized `wateringCopy` in this UI module.

- [ ] **Step 1: Write failing ControlChecks.** Fixture includes `#ui` and `#status`. Check native button, labeled progress `max=5`, visible amount, 44px target/focus style, start/pause names and `aria-pressed`. Native Enter/Space/synthetic click trigger one toggle; repeated keydown is ignored; focus loss pauses. Repeated snapshot rendering does not duplicate controls or live announcements. Completion moves focus to the status before disabling a focused button; hiding/disposal does not strand focus.
- [ ] **Step 2: Run `python tests/watering_browser.py ControlChecks`; record RED.**
- [ ] **Step 3: Implement `createWateringControls`.** Use the spec's Vietnamese copy. Keep instruction/progress in a compact panel that fits portrait safe areas. Reuse the existing status region for coarse phase/whole-second announcements; do not announce every frame. While merely ready, retain M2's existing desk status and place the new instruction in a non-live paragraph. Active/paused/completed copy changes only when needed. Hide the panel before availability.
- [ ] **Step 4: Run ControlChecks and StateChecks plus typecheck/build.** Inspect ready/active/paused/complete control layouts in desktop and portrait sizes; no subject overlap.
- [ ] **Step 5: Commit `feat: add accessible watering controls`.** Do not bind canvas interaction in the UI module.

## Task 4: One interaction owner for drag and button input

**Files:** Create `src/experience/watering-interaction.ts`; extend harness/`InteractionChecks`.

**Consumes:** State, Room view and Controls contracts. **Produces:** the Interaction contract above.

- [ ] **Step 1: Write failing InteractionChecks.** Test primary pickup/drag and valid pour, off-target held pause, pointer release outside, cancellation/lost capture, ignored second pointer, right-click rejection and native button auto-align/start/pause. Test repeating Enter, button-focus loss, Escape, window blur and hidden-page interruption; inactive intervals never catch up. Transfer drag/button ownership during alignment and return; assert one owner, one progress rate and one completion. Verify disposed listeners cannot reactivate the can.
- [ ] **Step 2: Run `python tests/watering_browser.py InteractionChecks`; record RED.**
- [ ] **Step 3: Implement `createWateringInteraction`.** Pick the can subtree with a reused raycaster and current camera/canvas rectangle; convert CSS client coordinates to NDC using that rectangle, not window size or device pixels. Capture only an accepted primary pointer. Convert its moves to view rays. The button cancels drag before auto alignment, and drag cancels the button route before taking over. Each update evaluates current geometric aim, advances state and renders view/UI once. No production test global.
- [ ] **Step 4: Implement interruptions and cleanup.** Pause clears mode, capture and water before returning the can. On hidden/blur/cancel use immediate safe restoration; on ordinary release/pause allow the short return. Ignore input when unavailable/complete/disposed. Remove all listeners, controls, effect resources and owned tweens on dispose. Use only the existing application render loop.
- [ ] **Step 5: Run InteractionChecks plus State/View/ControlChecks and typecheck/build.** Include a canvas with nonzero offset and CSS scaling in picking tests. Commit `feat: unify drag and accessible watering input`.

## Task 5: Integrate M3 after the settled desk

**Files:** Modify `src/main.ts`; extend `tests/watering_browser.py` with `WateringExperienceChecks`; preserve `tests/bedroom_browser.py` expectations except an intentional, documented behavior change supported by the spec.

**Consumes:** `createWateringInteraction`, existing story callbacks and `BedroomBuildResult`. **Produces:** working M3 from ordinary startup/skip/retry through one completed watering session.

- [ ] **Step 1: Write failing experience checks.** Assert controls hidden during exterior/reveal/failure; normal, early/repeated skip and reduced motion enable them once at the desk. Complete five valid seconds using button, keyboard and touch/drag paths. Pause around two seconds, wait while inactive, resume only the remaining amount; no completion on off-target water. Exercise resize/orientation and live motion changes during aim/pour, room failure/retry, hide/blur, and teardown during alignment/pour/return. Assert no stuck stream/capture, no duplicate control/completion and no unexpected page errors/external requests.
- [ ] **Step 2: Run the new `WateringExperienceChecks`; record RED with the M2-only app.**
- [ ] **Step 3: Integrate without merging owners.** Create one inactive watering instance after a valid built room; `displayPhase('desk-settled')` enables it only when the bedroom is active. Repeated phase callbacks do not reset it. Pause/disable before exterior activation; dispose the old instance before room replacement. Catch interaction setup failure separately so a usable room remains visible with truthful failure copy. Call `watering.update(timestamp)` before rendering in the existing RAF.
- [ ] **Step 4: Wire lifecycle order.** Pause before resize/reframe and before a live motion change; apply reduced-motion view settings afterward. Dispose watering before the room/runtime. Existing room deadlines, stale-attempt disposal, skip and retry keep their ownership. Connect completion UI/return through the state/coordinator; retain the single optional callback for M4 without adding flowers/card or placeholder modules.
- [ ] **Step 5: Run all watering checks, existing bedroom checks, typecheck and production build.** Use Vite for module suites; run WateringExperienceChecks and existing ExperienceChecks against compiled preview too. Commit `feat: integrate milestone 3 watering experience` only after actual gates pass.

## Task 6: Inspect graphics, freeze evidence and finish review

**Files:** Only evidence-supported corrections to the above; update `AGENT.md`, the asset README if calibration changes, and `docs/HANDOFF.md`.

**Consumes:** complete M3. **Produces:** user-reviewable local preview and revision-bound check/review evidence.

- [ ] **Step 1: Inspect actual production renders.** Capture ready, held, pouring, paused, return and complete at 1440x900 and 390x844 with normal/reduced motion. Check stream origin/impact, can tilt/clearance, full pot/can frame, clean material response and legible controls. Sample start/stop/return as a sequence; correct supported glitches. Recheck M2 camera travel if its framing changed.
- [ ] **Step 2: Measure and verify affected content.** Run `npm run typecheck`, `npm run build`, focused dev watering+bedroom suites and compiled WateringExperienceChecks/ExperienceChecks for the final files. If assets change, run `python tests/validate_bedroom_glb.py`; keep its existing 60,000-triangle/50-primitive/6,000,000-byte caps. Inspect console/requests, bounded instance/resource counts and actual render submissions; do not claim phone FPS. Avoid duplicate unchanged runs solely for bookkeeping.
- [ ] **Step 3: Freeze and record exact source/assets.** Commit the implementation, record revision/GLB hash and actual PASS/FAIL/NOT_RUN results. A later relevant change invalidates affected evidence. Preserve known warnings distinctly.
- [ ] **Step 4: Obtain both independent read-only GPT reviews of that same revision.** Use the personal policy's allowed native model/effort pair, checked against current tool availability. Give each a self-contained brief/spec/frozen revision/captures, keep current-round findings separate until both finish, and record exposed model settings honestly. Correct supported findings and repeat affected gates and both independent reviews for the changed revision. Read-only prompts do not imply technical isolation.
- [ ] **Step 5: Save the handoff and keep preview available.** Record delivered M3 behavior, commands, final source/review IDs, warnings/limitations and the one-shot M4 connection. Documentation-only handoff commits must identify the reviewed source they preserve. Show actual captures, leave the local preview usable, and report user visual acceptance separately. Do not merge/deploy/push without applicable authorization.

## Commands and evidence conventions

Start the dev server separately from the repository root:

```powershell
npm run dev -- --host 127.0.0.1 --port 5175
```

In a second terminal, use the actual reported port in `GARDEN_TEST_URL`:

```powershell
$env:GARDEN_TEST_URL='http://127.0.0.1:5175'
python tests/watering_browser.py StateChecks
python tests/watering_browser.py ViewChecks
python tests/watering_browser.py ControlChecks
python tests/watering_browser.py InteractionChecks
python tests/watering_browser.py
python tests/bedroom_browser.py
npm run typecheck
npm run build
```

Start `npm run preview -- --host 127.0.0.1 --port 4176` separately; if another port is selected, use that reported URL. Set `GARDEN_TEST_URL` to the compiled preview and run `python tests/watering_browser.py WateringExperienceChecks` and `python tests/bedroom_browser.py ExperienceChecks`. Module suites require Vite's TS imports. Reuse the existing installed Python/Playwright/Chrome or report a concrete tooling blocker.

Keep logs/captures in this Codex task's `outputs` directory with an M3 prefix. The repository handoff contains portable commands and measured results, not a claim that an unrun check passed. All checkboxes above are planned work, not completed evidence.

## Plan self-review and coverage

- Five-second accumulation/pause/terminal signal: Task 1; input integration/actual completion rechecked in Tasks 4–6.
- Model calibration, valid soil aim, accepted graphics, reusable effects, feedback/restoration: Task 2; actual rendered sequence in Task 6.
- Semantic controls/copy/progress/focus and native keyboard activation: Task 3; app routing in Tasks 4–5.
- Single-pointer/button arbitration, cancellation/blur/visibility and repeat behavior: Task 4; end-to-end coverage in Task 5.
- M2 readiness/skip/retry/fallback, resize/motion changes, one loop and teardown: Task 5; both existing and new regression suites in Task 6.
- Actual graphics/resource evidence, frozen revision, both independent reviews and current handoff: Task 6.
- All consumers use the contracts declared above. Review Focus cases are assigned explicit tests. No speculative M4 code or new dependency is planned.

## Execution handoff

**Status:** Plan complete, awaiting user review and execution-method selection. The user approved the detailed spec; product-code implementation has not started.

**Recommended:** sequential root execution in this chat through `superpowers:executing-plans`, followed by the two independent final read-only reviews. Can-pose calibration, input ownership and actual framing share state, so keeping implementation together reduces handoff overhead.

**Alternative:** sequential subagent-driven execution, with a fresh allowed-model implementer and task reviewer per slice, followed by the two final independent reviews. This adds contexts and handoffs; it still requires the personal policy's `gpt-6-luna` with `high`/`xhigh`, and availability failure remains a blocker.

User approval of this concrete plan and execution method is the next gate. After approval, execute all tasks without task-by-task confirmation. Later M4 work, remote push, merge and deployment remain separately scoped.
