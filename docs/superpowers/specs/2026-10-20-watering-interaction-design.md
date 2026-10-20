# Milestone 3 — Watering interaction

**Status:** Detailed written design approved by the user on 2026-10-20 with “Duyệt spec, viết kế hoạch triển khai”. Implementation planning is authorized.

**Date:** 2026-10-20, Asia/Saigon

**Project:** `D:\Z_PROJECT\20_10`

**Baseline:** `38fdc13` on `codex/bedroom-reveal`; accepted visual source/assets `f426084a88fae72fe2d3969a44fcf2930738e5c1`.

## Intent and decisions already approved

The user accepted the refined bedroom and requested Milestone 3. The experience should now let the recipient pick up the pastel-blue can, water the desk plant, and understand both progress and completion without instructions from the sender. Preserve the accepted room, planter, can, palette and camera composition.

The user explicitly selected **preserve progress when watering stops**: valid watering accumulates across attempts until it totals five seconds. This resolves the open decision in `docs/PROJECT_SPEC.md`; a pause never resets that total.

The user then approved the proposed in-chat design with “Duyệt thiết kế M3 này”: drag the 3D can or use a semantic watering/pause button; pour only with valid aim; stop on release, invalid aim or leaving the page; finish once at five seconds. This approval authorizes this written design. The written-spec review and implementation-plan review still precede product-code changes under the brainstorming workflow.

## Scope and completion boundary

Include pickup/aim/return behavior for the existing can, valid-target detection, a delicate stream and drops, restrained pot/leaf feedback, accumulated progress, Vietnamese instructions, an accessible alternative action, interruption handling, and integration with M2 readiness and teardown.

M3 completes with the can returning to the desk, the water stopping, progress at 100%, and a truthful message that the plant has enough water. Emit a single completion/bloom-start signal for the subsequent flower sequence. The approved incremental boundary interprets “starting the bloom” in the project spec as this one-shot handoff; the authored tulip growth/petal animation and card are M4. Do not display a working flower/card invitation before that sequence exists. Do not add a fake bloom, empty M4 subsystem, or invented personal message.

No new runtime dependency, remote asset, camera orbit, room redesign, audio, backend, saved progress across reloads, deployment or merge is included. The current request is local milestone work. A reload begins a fresh gift experience.

## Approaches considered

| Approach | Benefit | Trade-off |
|---|---|---|
| Drag the 3D can, with an accessible watering/pause button | Preserves the feeling of handling the prop; gives touch and keyboard users an easy completion path | Both input routes must share exactly one progress/pose owner |
| Select the can, then select the pot | Requires less precise dragging | Needs an additional selection/cancel state and communicates handling less directly |
| Use the watering/pause button as the sole input | Smallest gesture surface and straightforward keyboard operation | Removes the intended pickup-and-aim action |

**Approved direction:** the first approach. The native button is a complete input route, not a decorative substitute for a required drag.

## Visitor flow

### Availability

- Initialize the interaction only after the room model is validated. Keep it inactive until the story reaches `desk-settled` with the bedroom visible.
- The normal intro, skip and reduced-motion paths all lead to the same available watering state. Repeated settlement callbacks must not create duplicate controls or reset progress.
- Show a short instruction such as `Kéo bình đến chậu, hoặc chọn “Tưới cây”.`, a labeled progress indicator, and the `Tưới cây` button. Keep the control panel in the existing UI's safe space, clear of the pot, spout and plant on portrait screens.
- Give the can a grab cursor and a restrained pickup/target affordance. The hint must not rely on hover or color alone.
- Keep watering controls hidden when the room is loading, unavailable, or not yet settled. The existing room retry/fallback remains functional.

### Drag with mouse or touch

1. Accept one primary left-button/touch pointer when it starts on the can. Ignore additional pointers and unrelated gestures.
2. Capture that pointer on the canvas so release outside the canvas still ends the gesture. Lift the can slightly and move it through a bounded area around the desktop.
3. Project the pointer into the room using the current camera and canvas bounds. A forgiving target zone near the pot can guide the can into a calibrated pouring pose. The body and handle must remain readable and clear of the plant/window.
4. When the nozzle is aligned over the inner soil area and tilted to pour, show water and advance progress. Moving out of that zone stops the water and pauses progress immediately, even if the pointer is still held.
5. Releasing or canceling returns the can to its original position and rotation. Normal release may use a brief eased return; cancellation, hidden-page recovery and reduced motion may restore it immediately. Water must stop before a return animation begins.

The bounded movement is an implementation aid, not a puzzle. Avoid requiring pixel-perfect aim, permitting the can to cross the camera or wall, or moving the pot to compensate for an invalid can pose.

### Accessible button route

- Use a native button with a clear accessible name and `aria-pressed` state. Pointer/touch activation and native Enter/Space activation must work.
- First activation selects a safe pouring pose. After alignment is valid, water and the same five-second progress begin. The button changes to `Tạm dừng`; a second activation stops and returns the can while preserving progress.
- Ignore key auto-repeat as a repeated toggle. Do not bind a global Space shortcut that overrides navigation or other controls.
- Losing the button's focus, window focus, or page visibility stops the automated action. Completion stops it too. Screen-reader/voice-generated button clicks must not require a physical key/pointer to remain held.
- Starting a manual drag cancels the button route before acquiring the drag. Both routes use the same counter and validity rules; they cannot pour concurrently or count twice.

## Valid watering and time accounting

Watering is valid only when all of these are true:

1. The application is live, the document is visible/focused, and the settled bedroom is active.
2. There is one active drag or button action, and completion has not occurred.
3. The can has reached an allowed pouring pose; its nozzle is above the soil and points into the pot's inner soil disk.
4. The calibrated outlet-to-soil path clears the rim and does not emerge from the can body, pass through the planter wall, or miss the pot.

Use scene-space geometry for the final validity check. A large screen-space hint/hit area may guide the gesture, but does not itself authorize water or progress. Reject a backward/upward spout, outlet below the rim, or impact outside the soil. Recompute aim when the can moves; resizing invalidates the active gesture until a fresh action.

Accumulate monotonic elapsed time only across valid active intervals. Inactive/invalid intervals contribute zero. Preserve elapsed valid time on every pause, clamp the total at 5,000 ms, and emit completion exactly once. Do not add hidden-page time, alignment/return animation time, or a delayed timer callback's inactive interval. Establish a fresh timing baseline after interruption. Progress must behave consistently at different render rates.

At exactly 5,000 ms: stop emission, cancel input ownership, clamp progress to full, restore the can, settle feedback, and emit the one-shot completion signal. Repeated input or callbacks after completion do nothing. A complete controller cannot return to watering during that page session.

## Logical states

| State | Meaning | Water / progress |
|---|---|---|
| Unavailable | Room absent, not settled, or controller disabled/disposed | Off; no time credit |
| Ready | Available; no active action and no accumulated time | Off; zero |
| Aiming | An input owns the can but its pouring pose is not yet valid | Off; accumulated time preserved |
| Watering | Active input and valid pouring geometry | On; accumulate up to five seconds |
| Paused | Available; input released/interrupted after partial progress | Off; accumulated time preserved |
| Complete | Five seconds reached and completion emitted | Off; full progress; later input ignored |

Input ownership (`none`, `drag`, or `button`) is separate from progress. An off-target held drag remains available for movement without becoming valid watering. Keep this small state model in a testable module; no state-machine library is needed.

## Graphics and interaction calibration

Use the accepted room GLB unchanged unless actual inspection demonstrates a necessary asset correction. `watering_can`, `plant_pot` and `plant_rest` are already independent roots. `buildBedroom` should expose the concrete references needed by watering instead of making the controller search arbitrary meshes each frame.

Establish the nozzle outlet/direction and soil target once in the builder/view from the current Blender-authored coordinates. Document this calibration with the asset source. For the baseline asset, the can pivot is `(1.91, 1.085, -0.85)`, the spout rose ends near `(1.407, 1.525, -0.85)` at rest, and the pot's soil is near Y=1.40. These are calibration inputs, not a hard-coded screen position. Transform the outlet with the moving can and keep the receiving target attached to the pot. The existing `pot_target` camera anchor is not automatically the soil surface.

Tune the held/pouring pose from actual desktop and portrait renders. The nozzle-to-soil path must be visible beside the stem, the entire can must remain in frame, and the body/handle must not hide the plant. Validate rest/held/pouring/return frames, not just static end poses. The accepted camera framing can be adjusted only if actual M3 movement needs it, with M2 transition rechecked afterward.

Create a thin, softly lit pale-blue/white stream and a small bounded set of droplets (at most 24). Use reusable geometry/instancing and preallocated working vectors/matrices. No per-frame geometry/material creation, fluid library, extra renderer, shadow-casting water light, or new post-processing chain. Hide stream and drops immediately when watering becomes invalid. Any soil wetness should accumulate subtly with progress and stay local to this pot.

Use a very small leaf/pot response while valid water is active; restore exact rest transforms afterward. Do not add a whole-desk wobble, large glow or particle burst. Avoid changing shared materials in a way that recolors the room/exterior. Retain the original transforms/material values needed for cleanup.

## Motion, interruption and recovery

- Under reduced motion, use immediate pickup/alignment/return poses, a stable thin water cue, and no droplet motion or pot/leaf oscillation. Five seconds of valid action are still required.
- A live motion-preference change pauses the action, preserves progress, restores the can and applies the new presentation mode. It does not replay the intro or complete watering automatically.
- Resize/orientation change pauses the action and releases capture before camera reframing. Preserve progress and require a fresh drag/button action after resize.
- Handle `pointerup`, `pointercancel`, `lostpointercapture`, window blur, hidden document, Escape, button focus loss, room deactivation and teardown explicitly. Clear input ownership and water immediately; do not depend only on a pointer-up event arriving.
- Release pointer capture safely and make repeated cancellation harmless. A new accepted action must cancel an outstanding return/alignment animation before controlling the can.
- If setup fails, retain the usable bedroom, hide/disable the failed interaction, and give a concise truthful Vietnamese recovery message. Do not let an interaction error start a competing camera story or masquerade as successful watering.

## UI and announcements

Keep visitor copy together outside mesh builders. Suggested copy:

- Instruction: `Kéo bình đến chậu, hoặc chọn “Tưới cây”.`
- Start: `Tưới cây`; active action: `Tạm dừng`.
- Aiming hint: `Đưa vòi bình vào chậu nhé.`
- Paused status: `Mình tưới tiếp từ đây nhé.`
- Completed status: `Cây đã đủ nước rồi.`

Use a labeled native progress element or equivalent semantic progressbar, with a visible amount such as `2 / 5 giây`. Progress and pause/completion must remain understandable without seeing water or distinguishing colors. Announce phase changes and coarse progress through a restrained status region; do not announce every animation frame or add competing live regions without a clear need.

Retain visible keyboard focus and at least 44px control targets. Keep the scene decorative to assistive technology because equivalent controls/status are in HTML. On completion, preserve focus on the completed action/status rather than removing a focused element unexpectedly. Future flower/card controls are not shown in M3.

## Module responsibilities and lifecycle

Follow the existing framework-free Vite/strict TypeScript/Three.js/GSAP architecture:

- A focused watering-state module owns accumulated time, phases and one-shot completion; it does not touch DOM or meshes.
- An interaction coordinator owns pointer capture, aiming, button/drag arbitration and cancellation. It consumes concrete room/view handles.
- A room watering view/effects module owns can poses, calibrated outlet/soil transforms, reusable stream/drop resources and restrained feedback.
- Semantic watering controls own DOM instructions, button state, progress and announcements. Visitor strings remain outside low-level geometry.
- `build-bedroom.ts` exposes the model references/calibration needed by the view. Keep the accepted packed loader and its required-node contract intact unless a documented need emerges.
- `main.ts` activates watering after `desk-settled`, pauses it before scene/resize/motion changes, invokes its update in the existing render loop, and disposes it before scene resources. Do not add another animation loop or parallel progress timer.

Exact filenames and small interfaces are implementation-plan decisions. Do not add a generic input/event/asset framework or empty future milestone files.

Teardown must stop emission and all owned tweens, release input capture, remove listeners/controls, and release only owned effect resources once. Coordinate effect removal/disposal with scene disposal so shared GLB resources and image bitmaps are not double-disposed. No late callback may update DOM or reattach effects after teardown.

## Verification and review requirements

Use the repository's type check and production build. Extend the existing Python/Playwright browser checks; no new general test framework or runtime test hook is required. Approval of this detailed spec will include the focused regression coverage below for implementation.

1. **State/time checks:** no credit while unavailable/aiming/paused; frame-rate-independent valid time; pause/resume totals; invalid aim preserves progress; 4,999 ms does not complete and 5,000 ms completes once; repeated completion/input is harmless; disposal blocks later callbacks.
2. **Aim/pose checks:** current-model nozzle calibration; valid soil intersection; rejection outside the disk, below the rim and with wrong direction; water remains attached to the nozzle while the can moves; return restores exact transforms.
3. **Pointer/touch checks:** pickup/move/valid pour; off-target held drag; release outside canvas; cancellation/lost capture; extra pointers ignored; no stream after release; resume to five seconds without duplicate ownership.
4. **Keyboard/alternative checks:** Enter/Space and native/synthetic activation; repeat ignored; start/pause/resume; focus loss and Escape stop; drag/button switching cannot double count; completion remains legible without 3D interaction.
5. **Lifecycle checks:** no watering before settlement; normal/skip/reduced-motion routes; room failure/retry; blur/visibility; resize/orientation; live motion changes; teardown during alignment, watering and return; WebGL fallback.
6. **Actual graphics:** inspect ready, held, pouring, paused and completed frames at 1440x900 and 390x844, including normal and reduced motion. Verify can/plant/rim clearance, visible water impact, readable progress/controls and a clean return. Inspect an actual start/stop sequence for stuck water or pose jumps.
7. **Regression/resource checks:** run the existing M2 checks with intentional copy/control changes reflected explicitly; recheck packed asset limits if an asset changes; inspect requests, JavaScript console, renderer submissions and bounded effect counts. Preserve the existing exterior and local-only assets.
8. **Independent reviews:** freeze the actual resulting revision for two independent read-only native GPT reviews under the personal policy. Keep current-round findings separate until both finish, correct supported findings, and reverify/review relevant revisions before reporting completion.

Report every result as PASS, FAIL or NOT_RUN, bound to the revision checked. The existing desktop X4122 precision warning and Vite chunk warning are baseline limitations, not proof of a new failure or a warning-free console. Headless portrait checks do not establish physical-phone performance.

## Acceptance conditions

1. A first-time visitor recognizes the can and can finish watering by mouse drag, touch drag, or the semantic button with keyboard/touch activation.
2. Water and time credit occur only with active input and valid nozzle-to-soil aim. Off-target input never advances progress.
3. Exactly five accumulated valid seconds complete once. Pauses preserve progress; inactive/background/alignment time is excluded.
4. Releasing, canceling, blurring, hiding, resizing or changing motion preference cannot leave water running, the can stuck, or duplicate input owners active.
5. The accepted room graphics remain coherent; held/pouring/rest can silhouettes and water impact read clearly in desktop and narrow portrait framing.
6. Instructions, progress, pause and completion are available in semantic HTML with visible focus and restrained announcements.
7. M2 loading/intro/skip/retry/fallback/teardown remain usable; new effects and listeners are bounded and cleaned up.
8. The completed state stops water, returns the can, shows full progress and emits the bloom-start handoff once. M4 connects the tulip/card sequence to that handoff.
9. Build, applicable regressions, actual render inspection and independent review evidence are recorded honestly for the implemented revision.

## Next gate

The user approved this detailed written specification. Write and review the concrete implementation plan and select execution method before product-code changes. Root implementation can continue sequentially, followed by the two independent reviewers required by the personal policy. This document does not claim that implementation, tests, or M3 review have run.
